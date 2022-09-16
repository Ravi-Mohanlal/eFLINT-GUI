import {useEffect, useState} from 'react'
import Tree from 'react-d3-tree'
import _ from 'lodash'
import {launchServer, terminateServer, executePhrase, history, revert, jump, uuid} from './Server.js'
import { useNavigate, useLocation } from "react-router-dom";

function Hist(props) {
    const location = useLocation()
    const [tree, setTree] = useState()
    const navigate = useNavigate()
    const [prev, setPrev] = useState([])

    useEffect(() => {
        history().then(data => {console.log('history', data); save(data)})
        console.log('TEST', location.state)
    }, [])

    function save(data) {
        console.log('all', data)
        var l = []
        data.data.response.edges[0].po.program = 'Initial'

        data.data.response.edges.forEach(edge => {
            console.log(edge)
            var temp = prev
            temp[edge.target] = edge.source
            setPrev(temp)

            if (l[edge.source]) {
                l[edge.source].children.push(edge.target)
            } else {
                l[edge.source] = {name: '', children: [edge.target], id: edge.source}
            }

            if (l[edge.target]) {
                l[edge.target].name = edge.po.program
            } else {
                l[edge.target] = {name: edge.po.program, children: [], id: edge.target}
            }
        })
        console.log(l)
        console.log(expanded(l, l[1].children[0]))
        setTree(expanded(l, l[1].children[0]))
    }

    function expanded(l, m) {
        return {name: l[m].name, children: l[m].children.map(n => expanded(l, n)), id: l[m].id}
    }

    const test = 'Test\nTest'

    const renderRectSvgNode = ({ nodeDatum, toggleNode }) => (
      <g>
        <circle r={15} style={{fill: nodeDatum.id == location.state.current ? "green" : "grey", stroke: location.state.viols[nodeDatum.id] && location.state.viols[nodeDatum.id].length ? 'crimson' : 'darkslategrey', 'stroke-width': 4}} onClick={(event) => {
            if (event.ctrlKey) {
                console.log('reverting', nodeDatum.id, prev[nodeDatum.id])
                jump(nodeDatum.id).then(revert(prev[nodeDatum.id]).then(history().then(data => {console.log('hist', data); save(data)})))
            }
            else {
                jump(nodeDatum.id)
                navigate('/', {state: location.state.viols})
            }}}>
            <title data-html="true">  {location.state.viols[nodeDatum.id] ? location.state.viols[nodeDatum.id].map(v =>
                v.violation == "duty" ? "Violated duty: " + v.value.textual : "Disabled action executed").join("\n") : ""} </title>
        </circle>
        <text fill="black" strokeWidth="0.5" x="20">
          {nodeDatum.name}
        </text>
      </g>
    );

    if (tree)
        return (
            <div className="treeWrapper">
                <Tree data={tree} translate={{x: 900, y: 100}}
                depthFactor={100} orientation={'vertical'} separation={{nonSiblings: 2, siblings: 2}}
                renderCustomNodeElement={renderRectSvgNode}/>
            </div>
    )
}

export default Hist
