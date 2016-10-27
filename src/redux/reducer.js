import {combineReducers} from 'redux-immutable';
import Immutable from 'immutable';

import * as actType from './action-types';
import * as constants from './constants';

const initialState = Immutable.Map({
  loadApi: Immutable.Map({
    stage: null,
    runtime: null,
    error: null,
  }),
  runCode: Immutable.Map({
    source: null,
    stage: null,
    ast: null,
    bytecode: null,
    result: null,
    error: null,
    pausing: null,
  }),
  editor: Immutable.Map({
    source: localStorage !== undefined ?
    localStorage.getItem(constants.LOCAL_STORAGE_SOURCE_KEY) :
    '',
    result: null,
    highlights: []
  }),
  googleDrive: Immutable.Map({
    stage: null,
    name: null,
    drive: null,
    save: null,
    open: null,
    share: null,
    error: null,
    fileId: null,
  }),
  REPL: Immutable.Map({
    //REPLcodePosition refers to the code position represented visually
    //on-screen when using the REPL, not to an index in the REPL history
    REPLCodePosition: 0,
    REPLHistoryCodeCopy: '',
    code: '',
    history: Immutable.List(),
  }),
  moreMenu: Immutable.Map({
    expanded: false,
    fontSize: 12,
  }),
  runDropdown: Immutable.Map({
    expanded: false,
  }),
});

function loadApi(state = initialState.get('loadApi'), action) {
  switch (action.type) {
    case actType.START_LOAD_RUNTIME:
      return state.merge({stage: constants.loadApiStages.STARTED, error: null});
    case actType.FINISH_LOAD_RUNTIME:
      return state.merge({stage: constants.loadApiStages.FINISHED,
                          runtime: action.payload});
    case actType.FAIL_LOAD_RUNTIME:
      return state.merge({stage: constants.loadApiStages.FAILED,
                          error: action.payload});
    default:
      return state;
  }
}

function REPL(state = initialState.get('REPL'), action) {
  switch (action.type) {
    case actType.GET_PREV_REPL_CODE:
      //if REPLCodePosition hasn't reached the begining of history and
      //the previous code isn't an empty string
      if (state.get('REPLCodePosition') < state.get('history').size &&
          state.getIn(['history',
                       state.get('history').size - state.get('REPLCodePosition') - 1,
                       'code']) !== '') {
        state = state.set('REPLCodePosition', state.get('REPLCodePosition') + 1);
        state = state
                   .set(
                     'REPLHistoryCodeCopy',
                     state.getIn([
                       'history',
                       state.get('history').size - state.get('REPLCodePosition'),
                       'code']));
        return state;
      }
      return state;
    case actType.GET_NEXT_REPL_CODE:
      if (state.get('REPLCodePosition') !== 0) {
        state = state.set('REPLCodePosition', state.get('REPLCodePosition') - 1);
        state = state.set('REPLHistoryCodeCopy',
                          state.getIn([
                            'history',
                            state.get('history').size - state.get('REPLCodePosition'),
                            'code']));
        return state;
      }
      return state;
    case actType.CHANGE_REPL_CODE:
      if (state.get('REPLCodePosition') > 0) {
        return state.set('REPLHistoryCodeCopy', action.payload);
      }
      return state.set('code', action.payload);
    case actType.RECEIVE_REPL_RESULT:
      if (state.get('REPLCodePosition') > 0) {
        return state.set('history', state.get('history').push(Immutable.Map({
          code: state.get('REPLHistoryCodeCopy'),
          result: action.payload
        })));
      }
      return state.set('history', state.get('history').push(Immutable.Map({
        code: state.get('code'),
        result: action.payload
      })));
    case actType.FINISH_EXECUTE:
      return state.set('code', '');
    case actType.CLEAR_REPL_CODE:
      return state.merge({REPLCodePosition: 0, code: ''});
    case actType.CLEAR_STATE:
      return initialState.get('REPL');
    default:
      return state;
  }
}

function editor(state = initialState.get('editor'), action) {
  switch (action.type) {
    case actType.CHANGE_SOURCE:
      return state.set('source', action.payload);
    case actType.STORE_EDITOR_RESULT:
      return state.set('result', action.payload);
    case actType.CONFIGURE_CODEMIRROR:
      return state.set('codemirrorOptions', action.payload);
    case actType.TURN_HIGHLIGHTS_ON:
      return state.mergeDeep({
        highlights: {
          [action.payload.target]: action.payload.highlights
        }
      });
    case actType.TURN_HIGHLIGHTS_OFF:
      return state.merge({
        highlights: {
          [action.payload.target]: []
        }
      });
    default:
      return state;
  }
}

function runCode(state = initialState.get('runCode'), action) {
  switch (action.type) {
    case actType.STORE_SOURCE:
      return state.set('source', action.payload);
    case actType.START_PARSE:
      return state.merge({stage: constants.runtimeStages.PARSING, error: null});
    case actType.FINISH_PARSE:
      return state.merge({stage: null, ast: action.payload});
    case actType.FAIL_PARSE:
      return state.merge({stage: null, error: action.payload});
    case actType.START_COMPILE:
      return state.set('stage', constants.runtimeStages.COMPILING);
    case actType.FINISH_COMPILE:
      return state.merge({stage: null, bytecode: action.payload});
    case actType.FAIL_COMPILE:
      return state.merge({stage: null, error: action.payload});
    case actType.START_EXECUTE:
      return state.set('stage', constants.runtimeStages.EXECUTING);
    case actType.FINISH_EXECUTE:
      return state.merge({stage: null, result: action.payload});
    case actType.FAIL_EXECUTE:
      return state.merge({stage: null, error: action.payload});
    case actType.STOP_RUN:
      return state.set('stage', null);
    case actType.PAUSE_RUN:
      return state.set('stage', constants.runtimeStages.PAUSING);
    default:
      return state;
  }
}

function googleDrive(state = initialState.get('googleDrive'), action) {
  switch (action.type) {
    case actType.START_CONNECT_DRIVE:
      return state.merge({
        stage: constants.driveStages.connect.STARTED,
        error: null,
      });
    case actType.FINISH_CONNECT_DRIVE:
      return state.merge({
        stage: constants.driveStages.connect.FINISHED,
        drive: action.payload,
      });
    case actType.FAIL_CONNECT_DRIVE:
      return state.merge({
        stage: constants.driveStages.connect.FAILED,
        error: action.payload,
      });
    case actType.START_SAVE_DRIVE:
      return state.merge({
        stage: constants.driveStages.save.STARTED,
      });
    case actType.FINISH_SAVE_DRIVE:
      return state.merge({
        stage: constants.driveStages.save.FINISHED,
        fileId: action.payload.fileId
      });
    case actType.FAIL_SAVE_DRIVE:
      return state.merge({
        stage: constants.driveStages.save.FAILED,
        error: action.payload,
      });
    case actType.START_OPEN_DRIVE:
      return state.merge({
        stage: constants.driveStages.open.STARTED,
      });
    case actType.FINISH_OPEN_DRIVE:
      return state.merge({
        stage: constants.driveStages.open.FINISHED,
        open: action.payload,
      });
    case actType.FAIL_OPEN_DRIVE:
      return state.merge({
        stage: constants.driveStages.open.FAILED,
        error: action.payload,
      });
    case actType.START_SHARE_DRIVE:
      return state.merge({
        stage: constants.driveStages.share.STARTED,
      });
    case actType.FINISH_SHARE_DRIVE:
      return state.merge({
        stage: constants.driveStages.share.FINISHED,
        share: action.payload,
      });
    case actType.FAIL_SHARE_DRIVE:
      return state.merge({
        stage: constants.driveStages.share.FAILED,
        error: action.payload,
      });
    case actType.CHANGE_PROGRAM_NAME:
      return state.merge({
        name: action.payload
      });
    default:
      return state;
  }
}

function moreMenu(state = initialState.get('moreMenu'), action) {
  switch (action.type) {
    case actType.EXPAND_MORE_MENU:
      return state.set('expanded', true);
    case actType.COLLAPSE_MORE_MENU:
      return state.set('expanded', false);
    case actType.INCREMENT_FONT_SIZE:
      return state.set('fontSize',
                       Math.min(constants.fontBoundary.max, state.get('fontSize') + 4));
    case actType.DECREMENT_FONT_SIZE:
      return state.set('fontSize',
                       Math.max(constants.fontBoundary.min, state.get('fontSize') - 4));
    default:
      return state;
  }
}

function runDropdown(state = initialState.get('runDropdown'), action) {
  switch (action.type) {
    case actType.EXPAND_RUN_DROPDOWN:
      return state.set('expanded', true);
    case actType.COLLAPSE_RUN_DROPDOWN:
      return state.set('expanded', false);
    default:
      return state;
  }
}

const pyretReducer = combineReducers({
  loadApi,
  runCode,
  editor,
  REPL,
  googleDrive,
  moreMenu,
  runDropdown,
});

export default pyretReducer;
