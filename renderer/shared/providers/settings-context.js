import React, {useEffect} from 'react'
import semver from 'semver'
import {usePersistence} from '../hooks/use-persistent-state'
import {loadPersistentState} from '../utils/persist'
import {BASE_API_URL, BASE_INTERNAL_API_PORT} from '../api/api-client'
import useLogger from '../hooks/use-logger'
import {AVAILABLE_LANGS} from '../../i18n'

const SETTINGS_INITIALIZE = 'SETTINGS_INITIALIZE'
const TOGGLE_USE_EXTERNAL_NODE = 'TOGGLE_USE_EXTERNAL_NODE'
const TOGGLE_RUN_INTERNAL_NODE = 'TOGGLE_RUN_INTERNL_NODE'
const SAVE_EXTERNAL_URL = 'SAVE_EXTERNAL_URL'
const SAVE_LOG_LEVEL = 'SAVE_LOG_LEVEL'
const UPDATE_UI_VERSION = 'UPDATE_UI_VERSION'
const SET_INTERNAL_KEY = 'SET_INTERNAL_KEY'
const SET_EXTERNAL_KEY = 'SET_EXTERNAL_KEY'

const randomKey = () =>
  Math.random()
    .toString(36)
    .substring(2, 13) +
  Math.random()
    .toString(36)
    .substring(2, 13) +
  Math.random()
    .toString(36)
    .substring(2, 15)

const CHANGE_LANGUAGE = 'CHANGE_LANGUAGE'

const initialState = {
  url: BASE_API_URL,
  internalPort: BASE_INTERNAL_API_PORT,
  uiVersion: global.appVersion,
  useExternalNode: false,
  runInternalNode: true,
  internalApiKey: randomKey(),
  externalApiKey: '',
  lng: AVAILABLE_LANGS[0],
  logLevel: 'Info',
}

if (global.env && global.env.NODE_ENV === 'e2e') {
  initialState.url = global.env.NODE_MOCK
  initialState.runInternalNode = false
  initialState.useExternalNode = true
}

function settingsReducer(state, action) {
  switch (action.type) {
    case TOGGLE_USE_EXTERNAL_NODE: {
      return {...state, useExternalNode: action.data}
    }
    case TOGGLE_RUN_INTERNAL_NODE: {
      const newState = {...state, runInternalNode: action.data}
      if (newState.runInternalNode) {
        newState.useExternalNode = false
      }
      return newState
    }
    case SAVE_EXTERNAL_URL:
      return {...state, url: action.data}
    case SAVE_LOG_LEVEL:
      return {...state, logLevel: action.data}
    case SETTINGS_INITIALIZE:
      return {
        ...initialState,
        ...state,
        initialized: true,
      }
    case UPDATE_UI_VERSION: {
      return {
        ...state,
        uiVersion: action.data,
      }
    }
    case SET_INTERNAL_KEY: {
      return {
        ...state,
        internalApiKey: action.data,
      }
    }
    case SET_EXTERNAL_KEY: {
      return {
        ...state,
        externalApiKey: action.data,
      }
    }
    case CHANGE_LANGUAGE: {
      return {
        ...state,
        lng: action.lng,
      }
    }
    default:
      return state
  }
}

const SettingsStateContext = React.createContext()
const SettingsDispatchContext = React.createContext()

// eslint-disable-next-line react/prop-types
function SettingsProvider({children}) {
  const [state, dispatch] = usePersistence(
    useLogger(
      React.useReducer(
        settingsReducer,
        loadPersistentState('settings') || initialState
      )
    ),
    'settings'
  )

  useEffect(() => {
    if (!state.initialized) {
      dispatch({
        type: SETTINGS_INITIALIZE,
      })
    }
  }, [dispatch, state.initialized])

  useEffect(() => {
    if (!state.internalApiKey) {
      dispatch({type: SET_INTERNAL_KEY, data: randomKey()})
    }
  })

  useEffect(() => {
    if (
      state.uiVersion &&
      global.appVersion &&
      semver.lt(state.uiVersion, global.appVersion)
    ) {
      dispatch({type: UPDATE_UI_VERSION, data: global.appVersion})
    }
  })

  const saveExternalUrl = url => {
    dispatch({type: SAVE_EXTERNAL_URL, data: url})
  }

  const saveLogLevel = logLevel => {
    dispatch({type: SAVE_LOG_LEVEL, data: logLevel})
  }

  const toggleUseExternalNode = enable => {
    dispatch({type: TOGGLE_USE_EXTERNAL_NODE, data: enable})
  }

  const toggleRunInternalNode = run => {
    dispatch({type: TOGGLE_RUN_INTERNAL_NODE, data: run})
  }

  const saveExternalApiKey = key => {
    dispatch({type: SET_EXTERNAL_KEY, data: key})
  }

  const changeLanguage = lng => dispatch({type: CHANGE_LANGUAGE, lng})

  return (
    <SettingsStateContext.Provider value={state}>
      <SettingsDispatchContext.Provider
        value={{
          saveExternalUrl,
          toggleUseExternalNode,
          toggleRunInternalNode,
          saveExternalApiKey,
          changeLanguage,
          saveLogLevel,
        }}
      >
        {children}
      </SettingsDispatchContext.Provider>
    </SettingsStateContext.Provider>
  )
}

function useSettingsState() {
  const context = React.useContext(SettingsStateContext)
  if (context === undefined) {
    throw new Error(
      'useSettingsState must be used within a SettingsStateProvider'
    )
  }
  return context
}

function useSettingsDispatch() {
  const context = React.useContext(SettingsDispatchContext)
  if (context === undefined) {
    throw new Error(
      'useSettingsDispatch must be used within a SettingsDispatchContext'
    )
  }
  return context
}

export {SettingsProvider, useSettingsState, useSettingsDispatch}
