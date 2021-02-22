import React, { useState } from 'react';
import Tree from 'react-d3-tree';
import USAMap from "react-usa-map";
import { Header, Button, Input } from 'semantic-ui-react'
import Select from 'react-select'
import { filter, findIndex, cloneDeep } from 'lodash'
import 'semantic-ui-css/semantic.min.css'
import { users } from './data/users'
import { getStates } from './data/USAStates'
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
  const [alpha, saveAlpha] = useState("")
  const [beta, saveBeta] = useState("")
  const [lcmr, saveLCMR] = useState(0)
  const [simplePath, saveSimplePath] = useState('')
  const [levelPath, saveLevelPath] = useState('')
  const [ws, setWS] = useState({})
  const [leafNodeParent, setLeafNodeParent] = useState({})
  const [flattenedNodes, setFlattendedNodes] = useState(flatten([nodes]))
  const USStates = getStates()
  
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
      label: "Add a Leaf Node",
      value: "ADD_LEAF_NODE"
    },{
      label: "Replication",
      value: "REPLICATION"
    },
    ,{
      label: "Working Set",
      value: "WORKING_SET"
    },{
      label: "Caching",
      value: "CACHING"
    },{
      label: "Forward Pointer",
      value: "FORWARD_POINTER"
    },
    ]
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

  const setAlpha = event => {
    saveAlpha(event.target.value)
  }

  const setBeta = event => {
    saveBeta(event.target.value)
  }

  const replicateAtNode = () => {
    const callerIndex = findIndex(flattenedNodes, { name: caller.value })
    const calleeIndex = findIndex(flattenedNodes, { name: callee.value })
    const callerAndNeighbors = filter(flattenedNodes, { parentId: flattenedNodes[callerIndex].parentId })
    const calleeAndNeighbors = filter(flattenedNodes, { parentId: flattenedNodes[calleeIndex].parentId })
    const totalNodeCount = callerAndNeighbors.length + calleeAndNeighbors.length;
    const lcmr = (totalNodeCount * Number(numberOfLookUps))/numberOfMoves
    saveLCMR(lcmr)
  }
  
  const showPointer = () => {
    const sourceIndex = findIndex(flattenedNodes, { name: caller.value })
    const destinationIndex = findIndex(flattenedNodes, { name: callee.value })
    const simpleForwarding = findPath(String(caller.value))
    const simpleForwardingPath = `${simpleForwarding.reverse().join('->')}->${callee.value}`
    const destinationNode = flattenedNodes[destinationIndex]
    const destTemp = simpleForwarding.slice(0, simpleForwarding.length - 1)
    const levelForwardingPath = `${destTemp.join('->')}->${destinationNode.parentId}->${destinationNode.name}`
    saveSimplePath(simpleForwardingPath)
    saveLevelPath(levelForwardingPath)
  }

  const getStateOptions = () => {
    return Object.keys(USStates).map(state => ({
      label: USStates[state].name,
      value: state
    }))
  }

  const statesCustomConfig = () => {
    return {
      [caller.value]: {
        fill: "navy",
      },
      [callee.value]: {
        fill: "#CC0000"
      }
    };
  };

  const showWorkingSet = () => {
    const numerator = Number(alpha) * Number(numberOfCalls)
    const denominator = Number(beta) * Number(numberOfMoves)
    const shouldReplicate = numerator >= denominator
    let wState = {...ws}
    if (shouldReplicate && wState[callee.value] !== undefined && !wState[callee.value].includes(caller.label)) {
      wState[callee.value].push(caller.label)
    } else if (!shouldReplicate && wState[callee.value] !== undefined && !wState[callee.value].includes(caller.label)) {
      wState[callee.value] = wState[callee.value].filter(val => val !== caller.label)
    } else {
      if (wState[callee.value] === undefined) wState[callee.value] = []
    }
    setWS(wState)
    // console.log({ caller: caller.value, callee: callee.value, alpha, beta, numberOfCalls, numberOfMoves, numerator, denominator, shouldReplicate })
  }

  const getLeafNodeOptions = () => {
    return [{
      label: "3",
      value: "3"
    },{
      label: "4",
      value: "4"
    },{
      label: "5",
      value: "5"
    },{
      label: "6",
      value: "6"
    },]
  }

  const addLeafNode = () => {
    const newNode = lastNodeNumber + 1;
    const tempNodes = cloneDeep(nodes)
    if (leafNodeParent.value === "3") {
      tempNodes.children[0].children[0].children.push({ "name": `${newNode}` })
    }
    if (leafNodeParent.value === "4") {
      tempNodes.children[0].children[1].children.push({ "name": `${newNode}` })
    }
    if (leafNodeParent.value === "5") {
      tempNodes.children[1].children[0].children.push({ "name": `${newNode}` })
    }
    if (leafNodeParent.value === "6") {
      tempNodes.children[1].children[1].children.push({ "name": `${newNode}` })
    }
    // console.log(leafNodeParent, tempNodes, tempNodes.children[0].children[0])
    incrementLastNodeNumber(newNode)
    setNodes(tempNodes)
    setFlattendedNodes(flatten([tempNodes]))
  }

  console.log({nodes, flattenedNodes})

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
          {mode.value === "FORWARD_POINTER" && <div>
            <Header as="h3">Forward Pointer</Header>
            <div className="select-cache">
              <label>Source</label>
              <Select onChange={setCaller} options={getNodeOptions()} />
            </div>
            <div className="select-cache">
              <label>Destination</label>
              <Select onChange={setCallee} options={getNodeOptions()} />
            </div>
            <div className="select-cache">
              <div>Number of Calls</div>
              <Input onChange={setNumberOfCalls} />
            </div>
            <div className="select-cache cache-buttons">
              <Button primary onClick={showPointer}>Show Forward Pointers</Button>
            </div>
          </div>}
          {mode.value === "ADD_LEAF_NODE" && <div>
            <Header as="h3">Add a Leaf Node</Header>
            <div className="select-cache">
              <label>Select Parent Node</label>
              <Select onChange={setLeafNodeParent} options={getLeafNodeOptions()} />
            </div>
            <div className="select-cache cache-buttons">
              <Button primary onClick={addLeafNode}>Save</Button>
            </div>
          </div>}
          {mode.value === "WORKING_SET" && <div>
            <Header as="h3">Working Set</Header>
            <div className="select-cache">
              <label>Caller</label>
              <Select onChange={setCaller} options={getStateOptions()} />
            </div>
            <div className="select-cache">
              <label>Callee</label>
              <Select onChange={setCallee} options={getStateOptions()} />
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
              <div>Alpha</div>
              <Input onChange={setAlpha} />
            </div>
            <div className="select-cache">
              <div>Beta</div>
              <Input onChange={setBeta} />
            </div>
            <div className="select-cache cache-buttons">
              <Button primary onClick={showWorkingSet}>Show Working Set</Button>
            </div>
          </div>}
        </div>
        <div id="treeWrapper" style={{ width: '70%', height: '35em' }}>
          {mode.value === "WORKING_SET" ? <>
            <USAMap customize={statesCustomConfig()} />
            {Object.keys(ws).map(state => (
              <div style={{ width: "80%", margin: '10px auto' }}>
                Working set of user in {USStates[state].name} = ({ws[state].join(',')})
              </div>
            ))}
          </> : <>
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

          {simplePath !== '' && <div style={{ width: "80%", margin: '0 auto' }}>
            <strong>Simple Forwarding Pointer:</strong> {simplePath}
            </div>}
          {levelPath !== '' && <div style={{ width: "80%", margin: '0 auto' }}>
          <strong>Level Forwarding Pointer:</strong> {levelPath}
          </div>}
          </>}
        </div>
      </div>
    </div>
  );
}

export default App;
