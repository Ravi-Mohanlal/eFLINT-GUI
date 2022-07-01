import {useEffect, useState} from 'react'
import Tree from 'react-d3-tree'
import _ from 'lodash'
import {launchServer, terminateServer, executePhrase, history, revert, uuid} from './Server.js'
import { useNavigate } from "react-router-dom";

function Hist() {
    const [tree, setTree] = useState()
    const navigate = useNavigate()

    useEffect(() => {
        history().then(data => {console.log('history', data); save(data)})
    }, [])

    function save(data) {
        var l = []
        data.data.response.edges[0].po.program = 'Initial'

        data.data.response.edges.forEach(edge => {
            console.log(edge)
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
        console.log(expanded(l, 2))
        setTree(expanded(l, 2))
    }

    function expanded(l, m) {
        return {name: l[m].name, children: l[m].children.map(n => expanded(l, n)), id: l[m].id}
    }

    if (tree)
        return (
            <div className="treeWrapper">
                <Tree data={tree} translate={{x: 900, y: 100}} onNodeClick={(node) => {revert(node.data.id); navigate('/')}}
                depthFactor={100} orientation={'vertical'} separation={{nonSiblings: 2, siblings: 2}}/>
            </div>
    )
}

export default Hist
