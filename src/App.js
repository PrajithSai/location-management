import React, { useState } from 'react';
import Tree from 'react-d3-tree';
// import Tree from 'react-tree-graph';
import { Header, Button } from 'semantic-ui-react'
import Select from 'react-select'
import { findIndex } from 'lodash'
import 'semantic-ui-css/semantic.min.css'
import { users } from './data/users'
import './App.scss'

function App() {
  const [lastNodeNumber, incrementLastNodeNumber] = useState(18)
  const [nodes, setNodes] = useState(users)
  const [caller, saveCaller] = useState({ label: "", value: "" })
  const [callee, saveCallee] = useState({ label: "", value: "" })
  const flattenedNodes = flatten([nodes])

  const straightPathFunc = (linkDatum, orientation) => {
    const { source, target } = linkDatum;
    return orientation === 'horizontal'
      ? `M${source.y},${source.x}L${target.y},${target.x}`
      : `M${source.x},${source.y}L${target.x},${target.y}`;
  };

  const handleNodeClick = (param) => {
    console.log(param)
  }

  const getNodeOptions = () => {
    const options = [];
    for (let i = 0; i <= lastNodeNumber; i += 1) {
      options.push({
        label: i,
        value: i,
      })
    }
    return options
  }

function flatten (data, parentId = "0"){
  return data.reduce((r, { children, name}) => {
    r.push({name, parentId});
    if (children) r.push(...flatten(children, name));
    return r;
  }, [])
}

  const findPath = (name, currentPath = []) => {
    const index = findIndex(flattenedNodes, { name })
    const currentNode = flattenedNodes[index]
    if (currentNode.parentId !== "0") {
      currentPath.push(currentNode.name)
      return findPath(currentNode.parentId, currentPath)
    } else {
      currentPath.push(currentNode.name)
      currentPath.push("0")
      return currentPath;
    }
  }

  const getInitialPath = () => {
    const callerPath = findPath(String(caller.value))
    const callePath = findPath(String(callee.value)).reverse()
    console.log(`${callerPath.join('->')}->${callePath.slice(1).join('->')}`)
  }

  const setCaller = (option) => {
    saveCaller(option)
  }

  const setCallee = (option) => {
    saveCallee(option)
  }

  return (
    <div className="App">
      <div className="App-div" style={{ margin: '15px', padding: '15px' }}>
        {/* <div>
          <Header as="h3">Add New Node</Header>
        </div> */}
        <div>
          <Header as="h3">Caching</Header>
          <div className="select-cache">
            <label>Caller</label>
            <Select onChange={setCaller} options={getNodeOptions()} />
          </div>
          <div className="select-cache">
            <label>Callee</label>
            <Select onChange={setCallee} options={getNodeOptions()} />
          </div>
          <div className="select-cache cache-buttons">
            <Button primary onClick={getInitialPath}>Show Initial Path</Button>
            <Button secondary>Show Cached Path</Button>
          </div>
        </div>
        <div id="treeWrapper" style={{ width: '100em', height: '100em' }}>
          <Tree data={nodes} orientation="vertical" pathFunc={straightPathFunc} onNodeClick={handleNodeClick} />
        </div>
      </div>
    </div>
  );
}

export default App;
