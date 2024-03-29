import {useEffect, useState, useRef} from 'react'
import { Link, useLocation } from "react-router-dom";
import _ from 'lodash'
import {launchServer, terminateServer, executePhrase, history, revert, jump, uuid} from './Server.js'
import './App.css'

function TableCell({value, j, i, isInt, editData}) {
    const type = isInt ? 'number' : 'text'

    function onChange(e) {
        editData(j, i, e.target.value)
    }

    return (
        <td> <input className={type} type={type} value={value} onChange={onChange}/> </td>
    )
}

function TableHeaders({headers}) {
    const {header, subheaders} = headers

    if (subheaders)
        return (
            <thead>
                <tr>
                    <th colSpan={subheaders.length}> {header} </th>
                    <th/>
                </tr>
                <tr>
                    {subheaders.map(subheader =>
                        <th> {subheader} </th>
                    )}
                    <th/>
                </tr>
            </thead>
        )
    else
        return (
            <thead>
                <tr>
                    <th> {headers.header} </th>
                    <th/>
                </tr>
            </thead>
        )
}

function TableRow({row, j, types, editData, addRow, deleteRow}) {
    return (
        <tr onFocus={() => addRow(j)}>
            {row.map((value, i) =>
                <TableCell value={value} j={j} i={i} isInt={types[i]} editData={editData}/>
            )}
            <td> <span className='close' onClick={() => deleteRow(j)}> × </span> </td>
        </tr>
    )
}

function TableData({initialData, types, phrase}) {
    const [data, setData] = useState(_.cloneDeep(initialData))

    useEffect(() => {
        setData(_.cloneDeep(initialData))
    }, [initialData])

    function editData(j, i, value) {
        const temp = _.cloneDeep(data)
        temp[j][i] = value
        setData(temp)
    }

    function addRow(j) {
        if (j === data.length - 1)
            setData([...data, Array(initialData[0].length).fill('')])
    }

    function deleteRow(j) {
        const temp = _.cloneDeep(data)
        temp[j][0] = ''
        phrase(initialData, temp)
    }

    function onBlur(e) {
        if (!e.currentTarget.contains(e.relatedTarget))
            phrase(initialData, data)
    }

    return (
        <tbody onBlur={onBlur}>
            {data.map((row, j) =>
                <TableRow row={row} j={j} types={types} editData={editData} addRow={addRow} deleteRow={deleteRow}/>
            )}
        </tbody>
    )
}

function Table({tableData, save}) {
    const header = tableData.headers.header

    function phrase(initialData, data) {
        var phrase = ''

        data.forEach((row,j) => {
            const initialRow = initialData[j]

            if (!_.isEqual(initialRow, row)) {
                if (initialRow && initialRow.every(value => value !== '')) {
                    phrase += '-' + header + '('
                    initialRow.forEach(value => {
                        phrase += value + ','
                    })
                    phrase = phrase.slice(0,-1) + ').'
                }

                if (row.every(value => value !== '')) {
                    phrase += '+' + header + '('
                    row.forEach(value => {
                        phrase += value + ','
                    })
                    phrase = phrase.slice(0,-1) + ').'
                }
            }
        })

        executePhrase(phrase).then(d => save(d))
    }

    return (
        <div className='tablecont'>
        <table>
            <TableHeaders headers={tableData.headers}/>
            <TableData initialData={tableData.data} types={tableData.types} phrase={phrase} />
        </table>
        </div>
    )
}

function Tables({factData, save}) {
    return (
        <div className='Tables'>
            {factData.map((tableData, j) =>
                <Table tableData={tableData} save={save}/>
            )}
        </div>
    )
}

function ActTableRow({row, j, editData, addRow, deleteRow, execute, header}) {
    const [flag, setFlag] = useState(false)

    useEffect(() => {
        phrase2()
    })

    function phrase2() {
        var phrase = '?Enabled(' + header + '('

        row.forEach(value => {
            phrase += value + ','
        })

        phrase = phrase.slice(0,-1) + '))'

        executePhrase(phrase).then(data => {setFlag(data.data.response['query-results'] &&
            data.data.response['query-results'][0] === 'success'); console.log(data); revert(data.data.response['old-state']).then(dato => console.log('rev', dato))})
    }

    return (
        <tr onFocus={() => addRow(j)} onBlur={phrase2}>
            {row.map((value, i) =>
                <TableCell value={value} j={j} i={i} editData={editData}/>
            )}
            <td>
                <span className='close' onClick={() => deleteRow(j)}> × </span>
                {flag ? <span className='play' onClick={() => execute(j)}> ► </span>
                      : <span className='plain' onClick={() => execute(j)}> ► </span>}
            </td>
        </tr>
    )
}

function ActTableData({initialData, phrase, header}) {
    const [data, setData] = useState(_.cloneDeep(initialData))

    function editData(j, i, value) {
        const temp = _.cloneDeep(data)
        temp[j][i] = value
        setData(temp)
    }

    function addRow(j) {
        if (j === data.length - 1)
            setData([...data, Array(initialData[0].length).fill('')])
    }

    function deleteRow(j) {
        const temp = _.cloneDeep(data)
        temp.splice(j,1)
        setData(temp)
    }

    function execute(j) {
        phrase(data, j)
    }

    return (
        <tbody>
            {data.map((row, j) =>
                <ActTableRow row={row} j={j} editData={editData} addRow={addRow} deleteRow={deleteRow} execute={execute} header={header}/>
            )}
        </tbody>
    )
}

function ActTable({headers, data, save}) {
    function phrase(data, j) {
        var phrase = headers.header + '('

        data[j].forEach(value => {
            phrase += value + ','
        })

        phrase = phrase.slice(0,-1) + ')'

        executePhrase(phrase).then(d => save(d))
    }

    return (
        <div className='tablecont'>
        <table>
            <TableHeaders headers={headers}/>
            <ActTableData initialData={data} phrase={phrase} header={headers.header} />
        </table>
        </div>
    )
}

function ActTables({actData, save}) {
    return (
        <div className='actTables'>
            {actData.map(({headers, data}, j) =>
                <ActTable headers={headers} data={data} save={save} key={headers.header}/>
            )}
        </div>
    )
}

function DutyTableRow({row, j, editData, addRow, deleteRow, header}) {
    const [flag, setFlag] = useState(false)

    useEffect(() => {
        phrase()
    })

    function phrase() {
        var phrase = '?Violated(' + header + '('

        row.forEach(value => {
            phrase += value + ','
        })

        phrase = phrase.slice(0,-1) + '))'

        executePhrase(phrase).then(data => {setFlag(data.data.response['query-results'] &&
            data.data.response['query-results'][0] === 'success'); revert(data.data.response['old-state']).then(dato => console.log('rev2', dato))})
    }

    return (
        <tr onFocus={() => addRow(j)} onBlur={phrase}>
            {row.map((value, i) =>
                <TableCell value={value} j={j} i={i} editData={editData}/>
            )}
            <td>
                <span className='close' onClick={() => deleteRow(j)}> × </span>
                {flag ? <span className='cross' title='Duty is violated'> ❌ </span>
                      : <span className='check' title='Duty is not violated'> ✔️ </span>}
            </td>
        </tr>
    )
}

function DutyTableData({initialData, phrase2, header}) {
    const [data, setData] = useState(_.cloneDeep(initialData))

    useEffect(() => {
        setData(_.cloneDeep(initialData))
    }, [initialData])

    function editData(j, i, value) {
        const temp = _.cloneDeep(data)
        temp[j][i] = value
        setData(temp)
    }

    function addRow(j) {
        if (j === data.length - 1)
            setData([...data, Array(initialData[0].length).fill('')])
    }

    function deleteRow(j) {
        const temp = _.cloneDeep(data)
        temp.splice(j,1)
        setData(temp)
    }

    function onBlur(e) {
        if (!e.currentTarget.contains(e.relatedTarget))
            phrase2(initialData, data)
    }

    return (
        <tbody onBlur={onBlur}>
            {data.map((row, j) =>
                <DutyTableRow row={row} j={j} editData={editData} addRow={addRow} deleteRow={deleteRow} header={header}/>
            )}
        </tbody>
    )
}

function DutyTable({headers, data, save}) {
    function phrase2(initialData, data) {
        var phrase = ''

        data.forEach((row,j) => {
            const initialRow = initialData[j]

            if (!_.isEqual(initialRow, row)) {
                if (initialRow && initialRow.every(value => value !== '')) {
                    phrase += '-' + headers.header + '('
                    initialRow.forEach(value => {
                        phrase += value + ','
                    })
                    phrase = phrase.slice(0,-1) + ').'
                }

                if (row.every(value => value !== '')) {
                    phrase += '+' + headers.header + '('
                    row.forEach(value => {
                        phrase += value + ','
                    })
                    phrase = phrase.slice(0,-1) + ').'
                }
            }
        })

        executePhrase(phrase).then(d => save(d))
    }

    return (
        <div className='tablecont'>
        <table>
            <TableHeaders headers={headers}/>
            <DutyTableData initialData={data} phrase2={phrase2} header={headers.header} />
        </table>
        </div>
    )
}

function DutyTables({actData, save}) {
    return (
        <div className='dutyTables'>
            {actData.map(({headers, data}, j) =>
                <DutyTable headers={headers} data={data} save={save}/>
            )}
        </div>
    )
}

function SelectFileButton({save}) {

    const fileInput = useRef();
    const selectFile = () => {
        fileInput.current.click();
    }

    const showFile = async (e) => {
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = async (e) => {
            const text = (e.target.result)
            executePhrase(text).then(d => save(d))
            console.log(text)
        };
        reader.readAsText(e.target.files[0])
    }

    return (
        <div className='mt-5' >
            <input type="file" style={{ "display": "none" }} ref={fileInput} onChange={(e) => showFile(e)}/>
            <button onClick={selectFile} className='histButton upload' >
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-cloud-upload m-1" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                    <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z" />
                </svg>
            </button>
        </div>
    )
}



function App() {
    const [tableData, setTableData] = useState()
    const location = useLocation()
    const [viols, setViols] = useState(location.state ? location.state : [])
    const [current, setCurrent] = useState()

    useEffect(() => {
        if (uuid) {
            get()
            return
        }

        window.addEventListener('beforeunload', terminateServer)
        launchServer().then(() => get())
    }, [])

    function get() {
        executePhrase('').then(data => data ? save(data) : get())
    }

    function save(data) {
        setCurrent(data.data.response['new-state'])
        var temp = viols
        temp[data.data.response['new-state']] = data.data.response.violations
        console.log("viols", temp)
        setViols(temp)
        console.log('save', data)
        const declarations = Object.entries(data.data.response.declarations.decls)

        var type = {}
        declarations.forEach(([header, declaration]) => {
            type[header] = type[header] = declaration.domain['domain-type'] === 'AnyInt'
        })

        const tableData = declarations.filter(([header, declaration]) =>
            (declaration.kind['kind-type'] === 'Fact' && header !== 'int' && header !== 'ref' && header !== 'actor')
        ).map(([header, declaration]) => {
            const headers = {header: header}

            if (declaration.domain['domain-type'] === 'Products')
                headers.subheaders = declaration.domain.vars.map(v => v.domID + v.string)

            const facts = data.data.response.target_contents

            const factData = facts.filter(fact => fact['fact-type'] === header).map(fact => {
                return fact.hasOwnProperty('value') ? [fact.value]
                       : fact.arguments.map(arg => arg.value)
            })

            factData.push(headers.subheaders ? Array(headers.subheaders.length).fill('') : [''])

            const types = headers.subheaders ? headers.subheaders.map(h => type[h])
                                             : [type[headers.header]]

            return {headers: headers, data: factData, types: types}
        })

        const actData = declarations.filter(([header, declaration]) => (
            declaration.kind['kind-type'] === 'Act'
        )).map(([header, declaration]) => {
            const subheaders = declaration.domain.vars.map(v => v.domID + v.string)
            const headers = {header: header, subheaders: subheaders}
            return {headers: headers, data: [Array(subheaders.length).fill('')]}
        })

        const dutyData = declarations.filter(([header, declaration]) => (
            declaration.kind['kind-type'] === 'Duty'
        )).map(([header, declaration]) => {
            const subheaders = declaration.domain.vars.map(v => v.domID + v.string)
            const headers = {header: header, subheaders: subheaders}
            const duties = data.data.response['all-duties']
            const dutiesData = duties.filter(duty => duty['fact-type'] === header).map(duty => {
                return duty.arguments.map(arg => arg.value)
            })
            dutiesData.push(Array(subheaders.length).fill(''))
            return {headers: headers, data: dutiesData}
        })

        setTableData({factData: tableData, actData: actData, dutyData: dutyData})
    }

    

//     function makeid(length) {
//     var result           = '';
//     var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//     var charactersLength = characters.length;
//     for ( var i = 0; i < length; i++ ) {
//       result += characters.charAt(Math.floor(Math.random() * 
//  charactersLength));
//    }
//    return result;
// }
// 
//     function random() {
//         var phrase = ''
//         for (let i = 0; i < 10; i++) {
//             phrase += '+person(' + makeid(5) + ').'
//         }
//         nr += 10;
//         console.log('nr', nr)
//         const num = Math.floor(Math.random()*nr)+2
//         console.log(num, phrase)
//         executePhrase(phrase).then(data => save(data))
//         jump(num)
//     }

    if (tableData) {
        return (
            <div>
                <Tables factData={tableData.factData} save={save}/>
                <Link className='histButton' to="history" state={{viols: viols, current: current}} style={{ textDecoration: 'none' }}> History </Link>
                <SelectFileButton save={save}/>
                <ActTables actData={tableData.actData} save={save}/>
                <DutyTables actData={tableData.dutyData} save={save}/>
            </div>
        )
    }
}

export default App
