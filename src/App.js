import React, { useState } from 'react';
import Tree from 'react-d3-tree';
// import Tree from 'react-tree-graph';
import { Header, Button, Input } from 'semantic-ui-react'
import Select from 'react-select'
import { filter, findIndex } from 'lodash'
import 'semantic-ui-css/semantic.min.css'
import { users } from './data/users'
import './App.scss'

function App() {
  const [lastNodeNumber, incrementLastNodeNumber] = useState(18)
  const [nodes, setNodes] = useState(users)
  const [caller, saveCaller] = useState({ label: "", value: "" })
  const [callee, saveCallee] = useState({ label: "", value: "" })
  const [mode, setMode] = useState({ label: "Caching", value: "CACHING" })
  const [numberOfCalls, saveNumberOfCalls] = useState(0);
  const [numberOfMoves, saveNumberOfMoves] = useState(0);
  const [threshold, saveThreshold] = useState(0);
  const [initialPath, saveIntialPath] = useState('')
  const [cachedPath, saveCachedPath] = useState('')
  const [cmr, saveCMR] = useState(0)
  const [numberOfLookUps, saveNumberOfLookUps] = useState(0)
  const [smax, saveSmax] = useState("")
  const [smin, saveSmin] = useState("")
  const [lcmr, saveLCMR] = useState(0)
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
        label: `${i}`,
        value: `${i}`,
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
    saveIntialPath(`${callerPath.join('->')}->${callePath.slice(1).join('->')}`)
  }

  const checkIfCacheable = () => {
    const ogCMR = (Number(numberOfCalls)/Number(numberOfMoves));
    saveCMR(ogCMR)
    return ogCMR >= threshold
  }

  const getCachedPath = () => {
    const isCacheable = checkIfCacheable()
    if (isCacheable) {
      const callerIndex = findIndex(flattenedNodes, { name: caller.value })
      const calleeIndex = findIndex(flattenedNodes, { name: callee.value })
      const ogCaller = flattenedNodes[callerIndex];
      const ogCallee = flattenedNodes[calleeIndex];
      let cachedPath;
      if (ogCaller.parentId === ogCallee.parentId) {
        cachedPath = `${ogCaller.name}->${ogCaller.parentId}->${ogCallee.name}`
      } else {
        cachedPath = `${ogCaller.name}->${ogCaller.parentId}->${ogCallee.parentId}->${ogCallee.name}`
      }
      getInitialPath()
      saveCachedPath(cachedPath)
    }
  }

  const setCaller = (option) => {
    saveCaller(option)
  }

  const setCallee = (option) => {
    saveCallee(option)
  }

  const getModeOptions = () => {
    return [{
      label: "Caching",
      value: "CACHING"
    },{
      label: "Replication",
      value: "REPLICATION"
    }]
  }

  const setNumberOfCalls = (event) => {
    saveNumberOfCalls(event.target.value)
  }

  const setNumberOfMoves = event => {
    saveNumberOfMoves(event.target.value)
  }

  const setThreshold = event => {
    saveThreshold(event.target.value)
  }

  const setNumberOfLookups = event => {
    saveNumberOfLookUps(event.target.value)
  }

  const setSmax = event => {
    saveSmax(event.target.value)
  }

  const setSmin = event => {
    saveSmin(event.target.value)
  }

  // const replicateAtNode = () => {
  //   const childNodes = filter(flattenedNodes, { parentId: replicationNode.value })
  //   // const allNodes = childNodes.map(node => ({ ...node, cost: 1 }));
  //   let allNodes = [];
  //   for (let i = 0; i < childNodes.length; i += 1) {
  //     const newChildNodes = filter(flattenedNodes, { parentId: childNodes[i].name })
  //     if (newChildNodes.length === 0 && i === 0) {
  //       allNodes = childNodes.map(node => ({ ...node, cost: 1 }));
  //       break;
  //     }
  //     newChildNodes.map(node => {
  //       allNodes.push({ ...node, cost: 2 })
  //       return node;
  //     })
  //   }
  //   const totalCost = allNodes.reduce((pVal, cVal) => pVal + cVal.cost, 0)
  //   saveLCMR(totalCost/numberOfMoves)
  //   console.log({childNodes, allNodes, totalCost, lcmr: totalCost/numberOfMoves})
  // }

  const replicateAtNode = () => {
    const callerIndex = findIndex(flattenedNodes, { name: caller.value })
    const calleeIndex = findIndex(flattenedNodes, { name: callee.value })
    const callerAndNeighbors = filter(flattenedNodes, { parentId: flattenedNodes[callerIndex].parentId })
    const calleeAndNeighbors = filter(flattenedNodes, { parentId: flattenedNodes[calleeIndex].parentId })
    const totalNodeCount = callerAndNeighbors.length + calleeAndNeighbors.length;
    const lcmr = (totalNodeCount * Number(numberOfLookUps))/numberOfMoves
    saveLCMR(lcmr)
  }
  console.log(typeof lcmr, lcmr > 0, smax, smin)
  return (
    <div className="App">
      <div className="App-div" style={{ margin: '15px', padding: '15px', display: 'flex' }}>
        <div style={{ width: "30%", height: '100vh', borderRight: '1px solid silver' }}>
          <Header as="h3">Select Mode</Header>
          <div className="select-cache">
            <label>Mode</label>
            <Select value={mode} onChange={setMode} options={getModeOptions()} />
          </div>
          {mode.value === "CACHING" && <div>
            <Header as="h3">Caching</Header>
            <div className="select-cache">
              <label>Caller</label>
              <Select onChange={setCaller} options={getNodeOptions()} />
            </div>
            <div className="select-cache">
              <label>Callee</label>
              <Select onChange={setCallee} options={getNodeOptions()} />
            </div>
            <div className="select-cache">
              <div>Number of Calls</div>
              <Input onChange={setNumberOfCalls} />
            </div>
            <div className="select-cache">
              <div>Number of Moves</div>
              <Input onChange={setNumberOfMoves} />
            </div>
            <div className="select-cache">
              <div>Threshold</div>
              <Input onChange={setThreshold} />
            </div>
            <div className="select-cache cache-buttons">
              <Button primary onClick={getInitialPath}>Show Initial Path</Button>
              <Button secondary onClick={getCachedPath}>Show Cached Path</Button>
            </div>
          </div>}
          {mode.value === "REPLICATION" && <div>
            <Header as="h3">Replication</Header>
            <div className="select-cache">
              <label>Caller</label>
              <Select onChange={setCaller} options={getNodeOptions()} />
            </div>
            <div className="select-cache">
              <label>Callee</label>
              <Select onChange={setCallee} options={getNodeOptions()} />
            </div>
            <div className="select-cache">
              <div>Number of Lookups</div>
              <Input onChange={setNumberOfLookups} />
            </div>
            <div className="select-cache">
              <div>Number of Moves</div>
              <Input onChange={setNumberOfMoves} />
            </div>
            <div className="select-cache">
              <div>S-max</div>
              <Input onChange={setSmax} />
            </div>
            <div className="select-cache">
              <div>S-min</div>
              <Input onChange={setSmin} />
            </div>
            <div className="select-cache cache-buttons">
              <Button primary onClick={replicateAtNode}>Replicate</Button>
            </div>
          </div>}
        </div>
        <div id="treeWrapper" style={{ width: '70%', height: '35em' }}>
          <Tree
            data={nodes}
            orientation="vertical"
            pathFunc={straightPathFunc}
            onNodeClick={handleNodeClick}
            separation={{nonSiblings: 1, siblings: 1}}
          />
          {initialPath !== '' && <div style={{ width: "80%", margin: '0 auto' }}>
            <strong>Initial Path:</strong> {initialPath}
            </div>}
          {cachedPath !== '' && <div style={{ width: "80%", margin: '0 auto' }}>
          <strong>Cached Path:</strong> {cachedPath}
          </div>}
          {cmr > 0 && <div style={{ width: "80%", margin: '0 auto' }}>
            <strong>CMR: </strong> {cmr}{cmr < threshold && " -->CMR is less than threshold, caching not required."}
          </div>}
          {lcmr > 0 && <div style={{ width: "80%", margin: '0 auto' }}>
            <strong>LCMR: </strong> {lcmr}
          </div>}
          {lcmr > 0 && <div style={{ width: "80%", margin: '0 auto' }}>
            {Number(lcmr) > Number(smax) && caller.value + ' is assigned a replica.'}
            {Number(lcmr) < Number(smin) && caller.value + ' is not used for replication.'}
            </div>}
        </div>
      </div>
    </div>
  );
}

export default App;
