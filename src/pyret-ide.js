// This file exposes the api that consumers will use to interact
// with the pyret-ide library.
import ReactDOM from 'react-dom';
import React from 'react';
import {Provider} from 'react-redux';

import PyretIDE from './components/PyretIDE';
import createStore from './redux/createStore';
import reducer from './redux/reducer';
import {loadRuntimeApi} from './redux/actionCreators';

export default {
  init({rootEl, runtimeApiLoader}) {
    const store = createStore(reducer, {});
    store.dispatch(loadRuntimeApi(runtimeApiLoader));
    ReactDOM.render(
      <Provider store={store}>
        <PyretIDE/>
      </Provider>,
      rootEl
    );
  }
};