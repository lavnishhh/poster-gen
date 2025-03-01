import { useEffect } from 'react';
import { useState } from 'react'
import { useRef } from 'react'
import { capitalizeWords } from './helper';

const fieldFormatting = {
  'blood': {
    'blood': { prefix: 'Blood Group: ' },
    'count': { prefix: 'Units Required: ' },
  },
  'date': {
    'by': { prefix: 'By ' },
    'hours': { prefix: 'between ' },
  },
  'hospital': {
  },
  'patient_details': {
    'name': { prefix: 'Name: ' },
    'age': { prefix: 'Age: ' },
    'medical_issue': { prefix: 'Medical Issue: ' }
  },
  'contact': {
    'phone': { type: 'textarea' }
  }
}


function App() {
  const [count, setCount] = useState(0)

  const canvasRef = useRef()
  const formRef = useRef()


  const [layout, setLayout] = useState({
    'blood': {
      fields: { blood: '', count: '' },
      design: { x: 0.5, y: 0.29, text: '', size: 90 },
      sep: '\n',
    },
    'hospital': {
      fields: { name: '', 'branch/wing': '', city: '', },
      design: { x: 0.5, y: 0.39, text: 'Hospital Name, Area', color: '#a20000', size: 100 },
      sep: ', ',
    },
    'date': {
      fields: { by: '', hours: '' },
      design: { x: 0.5, y: 0.51, text: 'Date, Working Hours', size: 90 },
      sep: ', ',
    },
    'patient_details': {
      fields: { name: '', age: '', medical_issue: '' },
      design: { x: 0.5, y: 0.63, text: 'Patient Details', size: 80, maxWidth: 0.9 },
      sep: ', ',
    },
    'contact': {
      fields: { phone: '' },
      design: { x: 0.5, y: 0.757, text: 'Name: (Number) (s)', size: 70, color: 'white', maxWidth: 0.4 },
      sep: '\n',
    },
    'verified_date': {
      fields: {},
      headless: true,
      design: { x: 0.41, y: 0.91, text: `Verified on\n${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`, size: 70, color: 'white' },
    }
  });


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = '/blood-2.png';
    img.onload = () => {

      canvas.width = 2480;
      canvas.height = 3508;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      Object.entries(layout).forEach(([key, { fields, sep, design: { x, y, text, size, color = 'black', maxWidth = 1, prefix = '', suffix = '' } }]) => {
        ctx.font = `${size}px Garet-Book, Arial`;
        ctx.fillStyle = color;
        const lines = text.split('\n').flatMap(line => wrapText(ctx, `${prefix} ${line} ${suffix}`, maxWidth * canvas.width));
        console.log(text)
        lines.forEach((line, index) => {
          ctx.fillText(line, x * canvas.width, (y * canvas.height) + ((index - ((lines.length - 1) / 2)) * size) + (20 * index));
        });
      });
    };
  }, [layout]);

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const handleChange = (e) => {
    const formData = new FormData(formRef.current)
    const data = Object.fromEntries(formData.entries())
    console.log(data)
    setLayout((prevLayout) => {
      const updatedLayout = {};
      let fieldSet = {}

      Object.entries(prevLayout).forEach(([key, section]) => {
        if (section.fields) {
          fieldSet = {},
          Object.keys(section.fields).forEach(field => {
            fieldSet[field] = data[`${key}-${field}`] || ''
          })
          const text = Object.entries(fieldSet).map(([field, value]) => {
            if (!(key in fieldFormatting)) {
              return value
            }
            if (!(field in fieldFormatting[key])) {
              return value
            }
            if (field == 'blood') {
              value = extractBloodRequirements(data)
            }
            const { prefix = '', suffix = '' } = fieldFormatting[key][field]
            return `${prefix}${value}${suffix}`
          }).join(section.sep) || section.design.text

          updatedLayout[key] = {
            ...section,
            fields: {
              ...section.fields,
              ...fieldSet,
            },
            design: {
              ...section.design,
              text: text,
            },
          };
        } else {
          updatedLayout[key] = { ...section };
        }
      });

      return updatedLayout;
    });
  }

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const imageUrl = canvas.toDataURL('image/png'); // Converts canvas to PNG data URL
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `blood-requirement-${items.patient_name.text}.png`; // Set download filename
    link.click(); // Triggers the download
  }

  return (
    <div className='min-h-screen flex flex-col justify-center'>
      <div className='md:grid grid-cols-2 max-w-screen-lg mx-auto'>
        <div className='w-full p-5'>
          <h1 className='text-3xl'>Enter Details</h1>
          <form className='w-full grid md:block gap-4' ref={formRef} onChange={(e) => { handleChange(e) }}>
            {
              Object.entries(layout).map(([head, data], index) => {
                return <FieldSet key={index} head={head} data={data}></FieldSet>
              })
            }
          </form>
        </div>
        <div className='flex flex-col justify-center items-center'>
          <canvas className='w-full md:w-96' ref={canvasRef}></canvas>
          {/* <pre className='text-xs'>{
            JSON.stringify(layout, null, 4)
          }</pre> */}
          <div className='mx-auto'>
            <button className='bg-red-800 px-5 py-2 rounded-3xl my-4 text-white' onClick={downloadImage}>Download</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldSet({ head, data }) {
  return <div>
    {!data.headless && <h1 className='text-3xl mt-7'>{capitalizeWords(head.replace('_', ' '))}</h1>}
    {Object.entries(data.fields).map(([field, value], index) => {
      if (field == 'blood') {
        return <BloodGroupGrid></BloodGroupGrid>
      }
      let type = 'text';
      if (head in fieldFormatting && field in fieldFormatting[head]) {
        type = fieldFormatting[head][field].type || type
      }
      return <Field type={type} id={`${head}-${field}`} placeholder={capitalizeWords(field.replace('_', ' '))} key={index}>{field}</Field>
    })}
  </div>
}

function Field({ type, id, children, placeholder }) {
  return <div>
    <label htmlFor={id} className="block mb-1 text-sm font-medium text-white">{children}</label>
    {type == 'textarea' && <textarea type={type} name={id} id={id} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder={placeholder} required />}
    {type == 'text' && <input type={type} name={id} id={id} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder={placeholder} required />}
  </div>
}

function extractBloodRequirements(data) {
  const s = []
  const groups = ['A', 'B', 'AB', 'O']
  groups.map(blood => {
    if (`${blood}+` in data) {
      s.push(`${blood}+`);
    }
    if (`${blood}-` in data) {
      s.push(`${blood}-`);
    }
  })
  return s.join(', ')
}

const BloodGroupGrid = () => {
  const bloodGroups = ['A', 'B', 'AB', 'O'];

  return (
    <div className='grid grid-cols-1 gap-4 mt-4'>
      {bloodGroups.map((group, index) => (
        <div key={index} className='grid grid-cols-2'>
          <label key={`${group}-positive`}>
            <input
              type="checkbox"
              name={`${group}+`}
              className='me-2'
            />
            {group}+
          </label>
          <label key={`${group}-negative`}>
            <input
              type="checkbox"
              name={`${group}-`}
              className='me-2'
            />
            {group}-
          </label>
        </div>
      ))}
    </div>
  );
};



export default App
