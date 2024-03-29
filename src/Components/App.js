import React, { Component } from "react"
import Grid from "./Grid"
import Footer from "./Footer"
import { CONFIG } from "../Constants/Config"
import styled from "styled-components"
import { TEXTURES } from "../Constants/Textures"
import queryString from "query-string"
import { LEVELS } from "../Constants/Levels"
import { message, Modal } from "antd"
import { deviceIsTooSmall } from "../HelperFunctions"
import "antd/dist/antd.css"
const MainContainer = styled.div`
  display: flex;
  flex-flow: column;
  height: 100%;
`
export class App extends Component {
  constructor(props) {
    super(props)
    let params = this.parseLevelData(this.props.location.search)
    this.state = {
      textureSize: null,
      selectedEditTexture: null,
      editing: false,
      selectedLevel: CONFIG.DEFAULT_SELECTED_LEVEL,
      inProgress: false,
      URLParams: this.props.location.search === "" ? null : params,
      isInitialLoad: true,
      paused: false,
      reRenderGrid: false,
      ready: false,
      followCursor: false,
      playerSpeed: params.playerSpeed ? params.playerSpeed : CONFIG.DEFAULT_PLAYER_SPEED,
      playerMaxHealth: params.playerMaxHealth
        ? params.playerMaxHealth
        : CONFIG.DEFAULT_PLAYER_HEALTH,
      searchPriority: params.searchPriority
        ? params.searchPriority
        : CONFIG.DEFAULT_SEARCH_PRIORITY,
      chickenSpeed: params.chickenSpeed ? params.chickenSpeed : CONFIG.DEFAULT_CHICKEN_SPEED
    }
    this.onClickUndo = this.onClickUndo.bind(this)
    this.setTextureSize = this.setTextureSize.bind(this)
    this.setSelectedEditTexture = this.setSelectedEditTexture.bind(this)
    this.setEditing = this.setEditing.bind(this)
    this.onClickStart = this.onClickStart.bind(this)
    this.onClickRestart = this.onClickRestart.bind(this)
    this.onClickPause = this.onClickPause.bind(this)
    this.onClickResume = this.onClickResume.bind(this)
    this.setCharacterSpeed = this.setCharacterSpeed.bind(this)
    this.envIsReady = this.envIsReady.bind(this)
    this.enableFollowCursor = this.enableFollowCursor.bind(this)
    this.setCharacterMaxHealth = this.setCharacterMaxHealth.bind(this)
    this.setSearchPriority = this.setSearchPriority.bind(this)
    this.onFinishGame = this.onFinishGame.bind(this)
    this.generateLink = this.generateLink.bind(this)
    this.setSelectedLevel = this.setSelectedLevel.bind(this)
    this.parseLevelData = this.parseLevelData.bind(this)
    this.showTutorialMessages = this.showTutorialMessages.bind(this)
  }
  showTutorialMessages() {
    message.info("You Can Edit The Map And The AI Will React in RealTime!!")
    this.setState({ isInitialLoad: false })
  }
  parseLevelData(value) {
    return queryString.parse(value, {
      arrayFormat: "comma",
      parseNumbers: true,
      parseBooleans: true
    })
  }
  setSelectedLevel(level) {
    let levelData = this.parseLevelData(LEVELS[level])
    this.setState({ selectedLevel: level, ...levelData }, () => {
      this.grid.onSelectCustomLevel(levelData)
    })
  }

  componentDidMount() {
    if (deviceIsTooSmall(window)) this.setState({ deviceIsTooSmall: true })
    else {
      message.info("Click on The Help Icon At Bottom To Help You Start!")
      window.addEventListener("keydown", e => {
        if (e.key.toLowerCase() === " ") {
          if (!this.state.inProgress && this.state.ready) this.onClickStart()
          else if (this.state.inProgress && this.state.paused) this.onClickResume()
          else if (this.state.inProgress && !this.state.paused) this.onClickPause()
        }
      })
    }
  }

  onFinishGame() {
    this.setState({ inProgress: false })
  }
  generateLink() {
    this.grid.updateURL()
  }
  setCharacterMaxHealth(type, value) {
    this.setState({ [type + "MaxHealth"]: value })
  }
  enableFollowCursor() {
    if (this.state.ready) {
      this.setState({ followCursor: true, inProgress: true })
    }
  }
  setCharacterSpeed(type, speed) {
    this.setState({ [type + "Speed"]: speed })
  }
  onClickUndo() {
    this.grid.undoEdit()
  }
  setTextureSize(size, reRender) {
    this.setState({ textureSize: size, reRenderGrid: reRender })
    if (reRender) {
      this.onClickRestart()
    }
  }
  envIsReady() {
    this.setState({ ready: true })
  }
  setEditing(value) {
    this.setState({ editing: value })
  }
  setSelectedEditTexture(texture) {
    let isEditing =
      texture !== null && texture !== TEXTURES.PLAYER_IDLE && texture !== TEXTURES.CHICKEN_IDLE
    this.setState({
      selectedEditTexture: texture,
      editing: isEditing
    })
  }
  onClickStart() {
    this.setState({ inProgress: true })
  }
  onClickRestart() {
    this.setState({
      paused: false,
      inProgress: false,
      selectedEditTexture: null,
      editing: false,
      followCursor: false
    })
    if (this.grid !== undefined) this.grid.onClickRestart()
  }
  onClickPause() {
    this.setState({ paused: true })
  }
  onClickResume() {
    this.setState({ paused: false })
  }
  setSearchPriority(value) {
    this.setState({ searchPriority: value })
  }
  render() {
    return this.state.deviceIsTooSmall ? (
      <Modal footer={null} visible={true} closable={false}>
        This Device is Too Small for This Website, Please Use a Bigger Device.
      </Modal>
    ) : (
      <MainContainer>
        <Grid onRef={ref => (this.grid = ref)} {...this.state} {...this}></Grid>
        <Footer {...this} {...this.state}></Footer>
      </MainContainer>
    )
  }
}

export default App
