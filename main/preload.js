// eslint-disable-next-line import/no-extraneous-dependencies
const electron = require('electron')

const {
  clipboard,
  nativeImage,
  ipcRenderer,
  remote: {app},
  shell,
  webFrame,
} = electron

const isDev = require('electron-is-dev')

const logger = require('./logger')
const {prepareDb} = require('./stores/setup')
const {loadKeyword} = require('./utils/keywords')

process.once('loaded', () => {
  global.ipcRenderer = ipcRenderer
  global.openExternal = shell.openExternal

  global.loadKeyword = loadKeyword

  global.logger = logger

  global.isDev = isDev
  global.prepareDb = prepareDb
  global.isMac = process.platform === 'darwin'

  global.clipboard = clipboard
  global.nativeImage = nativeImage
  ;[global.locale] = app.getLocale().split('-')

  global.getZoomLevel = () => webFrame.getZoomLevel()
  global.setZoomLevel = level => webFrame.setZoomLevel(level)

  global.appVersion = app.getVersion()

  global.env = {
    NODE_ENV: process.env.NODE_ENV,
    NODE_MOCK: process.env.NODE_MOCK,
    BUMP_EXTRA_FLIPS: process.env.BUMP_EXTRA_FLIPS,
    FINALIZE_FLIPS: process.env.FINALIZE_FLIPS,
  }

  if (isDev) {
    global.require = require
    // eslint-disable-next-line no-underscore-dangle
    global.__devtron = {require, process}
  }
})
