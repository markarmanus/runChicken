import { TEXTURES } from "./Constants/Textures"
import { CONSTANTS } from "./Constants/Constants"
import { CONFIG } from "./Constants/Config"
import { isSide } from "./HelperFunctions"
const costToLocation = (from, to) => {
  let dx = to[0] - from[0]
  let dy = to[1] - from[1]
  let distance = Math.sqrt(dx * dx + dy * dy)
  return distance * 100
}
const getActionType = action => {
  return action[0] + action[1] === 0 || Math.abs(action[0] + action[1]) === 2
    ? "diagonal"
    : "cardinal"
}
const isLegalAction = (x, y, action, state) => {
  const destinationPos = { x: x + action[0], y: y + action[1] }
  const actionType = getActionType(action)
  if (isOutOfBoundaries(destinationPos, state.gridWidth, state.gridHeight)) return false
  if (isSide(destinationPos.x, destinationPos.y, state.gridWidth, state.gridHeight)) return false
  const isDestinationWall =
    state.texturesMap[destinationPos.y * state.gridWidth + destinationPos.x] === TEXTURES.WALL
  if (actionType === "diagonal") {
    const isHorizontalWall =
      state.texturesMap[y * state.gridWidth + destinationPos.x] === TEXTURES.WALL
    const isVerticalWall =
      state.texturesMap[destinationPos.y * state.gridWidth + x] === TEXTURES.WALL

    return !(isHorizontalWall || isVerticalWall || isDestinationWall)
  } else {
    return !isDestinationWall
  }
}
const addToOpen = (nodeToAdd, open) => {
  let added = false
  // check if its already in the open list.
  for (let index = 0; index < open.length; index++) {
    let node = open[index]
    if (
      nodeToAdd.x === node.x &&
      nodeToAdd.y === node.y &&
      nodeToAdd.g >= node.g &&
      nodeToAdd.health <= node.health
    ) {
      added = true
      break
    }
  }
  // if its not already in the open list add where it belongs based on the f value.
  if (!added) {
    const nodeToAddF = nodeToAdd.g + nodeToAdd.h
    // keep going until the f value is more than or qrual to the one in the open list and that where you add the node.
    for (let index = 0; index < open.length; index++) {
      const node = open[index]
      const nodeF = node.g + node.h
      if (nodeToAddF >= nodeF) {
        added = true
        open.splice(index, 0, nodeToAdd)
        break
      }
    }
  }
  // if was not added because it the smallest f then add it to the end..
  if (!added) {
    open.push(nodeToAdd)
  }
}

const getPath = node => {
  let action = node.action
  let parent = node.parent
  while (parent !== null && parent.action !== null) {
    action = parent.action
    parent = parent.parent
  }

  return action
}
const calculateChickenCollectedPaths = (state, actions) => {
  let connected = new Array(state.gridHeight * state.gridWidth).fill(false)
  let closed = new Array(state.gridHeight * state.gridWidth).fill(false)
  let open = []
  let chickenLocation = state.currentChickenLocation
  open.push(new Node(chickenLocation[0], chickenLocation[1], null, null, null, 0, 0))
  while (true) {
    if (open.length === 0) {
      return connected
    }
    let node = open.shift()
    const index = node.y * state.gridWidth + node.x

    if (closed[index]) {
      continue
    }
    closed[index] = true
    connected[index] = true
    actions.forEach(action => {
      if (isLegalAction(node.x, node.y, action, state)) {
        const newLocation = { x: node.x + action[0], y: node.y + action[1] }
        const isCloseToPlayerX =
          Math.abs(newLocation.x - state.currentPlayerLocation[0]) === 1 &&
          newLocation.y === state.currentPlayerLocation[1]
        const isCloseToPlayerY =
          Math.abs(newLocation.y - state.currentPlayerLocation[1]) === 1 &&
          newLocation.x === state.currentPlayerLocation[0]

        const isPlayerLocation =
          newLocation.x === state.currentPlayerLocation[0] &&
          newLocation.y === state.currentPlayerLocation[1]
        if (!isPlayerLocation && !isCloseToPlayerX && !isCloseToPlayerY) {
          open.push(new Node(newLocation.x, newLocation.y, null, node, action, 0, 0))
        }
      }
    })
  }
}
const debug = (array, state, props, printValue) => {
  array.forEach((value, index) => {
    const y = Math.floor(index / state.gridWidth)
    const x = Math.floor(index % state.gridWidth)
    if (value) {
      let div = document.createElement("div")
      div.style.position = "absolute"
      div.style.top = state.yOffset
        ? y * props.textureSize + state.yOffset + "px"
        : y * props.textureSize + "px"
      div.style.left = state.xOffset
        ? x * props.textureSize + state.xOffset + "px"
        : x * props.textureSize + "px"
      div.style.zIndex = "4"
      div.style.height = props.textureSize + "px"
      div.style.width = props.textureSize + "px"
      div.style.border = CONFIG.EDITING_BORDER

      if (printValue) {
        let h3 = document.createElement("h3")
        h3.innerText = value
        div.appendChild(h3)
      }
      document.body.appendChild(div)
    }
  })
}
const BFSFromPlayer = (state, props, actions) => {
  let connected = calculateChickenCollectedPaths(state, actions)
  let open = []
  let playerLocation = state.currentPlayerLocation
  open.push(
    new Node(playerLocation[0], playerLocation[1], state.currentPlayerHealth, null, null, 0, 0)
  )
  let closed = new Array(state.gridHeight * state.gridWidth).fill(false)
  let values = new Array(state.gridWidth * state.gridHeight).fill(0)
  while (true) {
    if (open.length === 0) {
      let index = values.indexOf(Math.max(...values))
      let y = Math.floor(index / state.gridWidth)
      let x = Math.floor(index % state.gridWidth)
      return [x, y]
    }
    let node = open.pop()
    const index = node.y * state.gridWidth + node.x

    if (closed[index]) {
      continue
    }

    closed[index] = true
    values[index] = node.g

    actions.forEach(action => {
      if (isLegalAction(node.x, node.y, action, state)) {
        const newLocation = [node.x + action[0], node.y + action[1]]
        const index = newLocation[1] * state.gridWidth + newLocation[0]
        if (
          connected[index] ||
          (node.x === state.currentPlayerLocation[0] && node.y === state.currentPlayerLocation[1])
        ) {
          const isFire = state.texturesMap[index] === TEXTURES.FIRE
          let newCost = node.g + 100
          newCost = isFire ? newCost + 500 : newCost
          const newHealth = isFire ? node.health - 1 : node.health
          if (newHealth <= 0) newCost = 100000000 + newCost
          let newNode = new Node(
            newLocation[0],
            newLocation[1],
            newHealth,
            node,
            action,
            newCost,
            0
          )
          addToOpen(newNode, open)
        }
      }
    })
  }
}
const isOutOfBoundaries = (position, gridWidth, gridHeight) => {
  return position.x < 0 || position.y < 0 || position.x >= gridWidth || position.y >= gridHeight
}
const getNextChickenAction = (actions, state, props) => {
  if (props.chickenSpeed === 0) return [0, 0]
  const start = state.currentChickenLocation
  const goal = BFSFromPlayer(state, props, actions)
  if (start[0] === goal[0] && start[1] === goal[1]) {
    return [0, 0]
  }

  let closed = new Array(state.gridHeight * state.gridWidth).fill(false)
  let open = []
  open.push(new Node(start[0], start[1], 0, null, null, 0, costToLocation(start, goal)))
  while (true) {
    if (open.length === 0) {
      return [0, 0]
    }
    let node = open.pop()
    if (node.x === goal[0] && node.y === goal[1]) {
      return getPath(node)
    }
    if (closed[node.y * state.gridWidth + node.x]) {
      continue
    }
    closed[node.y * state.gridWidth + node.x] = true
    actions.forEach(action => {
      if (isLegalAction(node.x, node.y, action, state)) {
        const newLocation = { x: node.x + action[0], y: node.y + action[1] }
        const isCloseToPlayerX =
          Math.abs(newLocation.x - state.currentPlayerLocation[0]) === 1 &&
          newLocation.y === state.currentPlayerLocation[1]
        const isCloseToPlayerY =
          Math.abs(newLocation.y - state.currentPlayerLocation[1]) === 1 &&
          newLocation.x === state.currentPlayerLocation[0]

        const isPlayerLocation =
          newLocation.x === state.currentPlayerLocation[0] &&
          newLocation.y === state.currentPlayerLocation[1]
        if (!(isCloseToPlayerX || isCloseToPlayerY)) {
          if (!isPlayerLocation) {
            const g = node.g + 100
            const h = costToLocation([newLocation.x, newLocation.y], goal)
            const newNode = new Node(newLocation.x, newLocation.y, 0, node, action, g, h)
            addToOpen(newNode, open)
          } else {
          }
        } else {
        }
      }
    })
  }
}
const getNextAction = (state, props, characterType) => {
  let actions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0]
  ]
  let diagonalActions = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1]
  ]
  if (props.allowDiagonalActions) actions = actions.concat(diagonalActions)
  if (characterType === CONSTANTS.CHICKEN) return getNextChickenAction(actions, state, props)
  let start = state.currentPlayerLocation
  let goal = state.currentChickenLocation
  let foundPath = false
  let bestPathNode = null
  let bestPathFoundHealth = 0
  //edge case when start is the goal.
  if (start[0] === goal[0] && start[1] === goal[1]) {
    return [0, 0]
  }

  let actionsCost = [100, 100, 100, 100, 144, 141, 141, 141]
  let closed = [...new Array(state.gridWidth * state.gridHeight)].map(() =>
    new Array(props.playerMaxHealth).fill(false)
  )

  let open = []
  open.push(
    new Node(
      start[0],
      start[1],
      state.currentPlayerHealth,
      null,
      null,
      0,
      costToLocation(start, goal)
    )
  )
  while (true) {
    if (open.length === 0) {
      if (foundPath) {
        return getPath(bestPathNode)
      }
      return [0, 0]
    }

    let node = open.pop()
    if (node.x === goal[0] && node.y === goal[1]) {
      if (node.health === props.playerMaxHealth || props.searchPriority === CONSTANTS.SPEED) {
        return getPath(node)
      } else if (node.health > bestPathFoundHealth) {
        foundPath = true
        bestPathFoundHealth = node.health
        bestPathNode = node
      }
    }

    // checks if node in closed, where closed is an array with true false values for any state at x,y by accessing index at y * the with + x
    if (closed[node.y * state.gridWidth + node.x][node.health - 1]) {
      continue
    }

    closed[node.y * state.gridWidth + node.x][node.health - 1] = true
    if (node.health <= 0) continue
    actions.forEach((action, index) => {
      if (isLegalAction(node.x, node.y, action, state)) {
        const newLocation = { x: node.x + action[0], y: node.y + action[1] }
        let g = node.g + actionsCost[index]
        const h = costToLocation([newLocation.x, newLocation.y], goal)
        const healthPackOnLocation =
          state.overLayMap[newLocation.y * state.gridWidth + newLocation.x] === TEXTURES.HEALTH_PACK
        const isLava =
          state.texturesMap[newLocation.y * state.gridWidth + newLocation.x] === TEXTURES.FIRE

        const health = healthPackOnLocation
          ? props.playerMaxHealth
          : isLava
          ? node.health - 1
          : node.health
        if (isLava && !healthPackOnLocation) g += 20

        const newNode = new Node(newLocation.x, newLocation.y, health, node, action, g, h)
        addToOpen(newNode, open)
      }
    })
  }
}

class Node {
  constructor(x, y, health, parent, action, g, h) {
    this.x = x
    this.y = y
    this.health = health
    this.action = action
    this.parent = parent
    this.g = g
    this.h = h
  }
}
export default getNextAction