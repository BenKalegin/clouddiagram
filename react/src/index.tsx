/* eslint-disable no-restricted-globals */
import { AzureClient, AzureContainerServices } from '@fluidframework/azure-client';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import {initializeIcons, mergeStyles, ThemeProvider} from '@fluentui/react';
import reportWebVitals from './reportWebVitals';
import {themeNameToTheme} from "./view/Themes";



export async function start() {
  initializeIcons();

  ReactDOM.render(
      <React.StrictMode>
        <ThemeProvider theme={themeNameToTheme("default")}>
          <App/>
        </ThemeProvider>
      </React.StrictMode>
     , document.getElementById('root'));
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
start().catch((error) => console.error(error));
reportWebVitals();
