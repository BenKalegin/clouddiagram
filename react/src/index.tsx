/* eslint-disable no-restricted-globals */
import { AzureClient, AzureContainerServices } from '@fluidframework/azure-client';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import {initializeIcons, mergeStyles, ThemeProvider} from '@fluentui/react';
import reportWebVitals from './reportWebVitals';
import {themeNameToTheme} from "./view/Themes";

// Inject some global styles
mergeStyles({
  ':global(body,html,#root)': {
    margin: 0,
    padding: 0,
    height: '100vh',
  },
});

export async function start() {
  initializeIcons();

  const getContainerId = (): { containerId: string; isNew: boolean } => {
    let isNew = false;
    if (location.hash.length === 0) {
      isNew = true;
    }
    const containerId = location.hash.substring(1);
    return {containerId, isNew};
  };

  const {containerId, isNew} = getContainerId();

  const client = new AzureClient(connectionConfig);

  let container: IFluidContainer;
  let services: AzureContainerServices;

  if (isNew) {
    ({container, services} = await client.createContainer(containerSchema));
    const containerId = await container.attach();
    location.hash = containerId;
  } else {
    ({container, services} = await client.getContainer(containerId, containerSchema));
  }

  if (!container.connected) {
    await new Promise<void>((resolve) => {
      container.once("connected", () => {
        resolve();
      });
    });
  }

  ReactDOM.render(
      <React.StrictMode>
        <ThemeProvider theme={themeNameToTheme("default")}>
          <App container={container} services={services}/>
        </ThemeProvider>
      </React.StrictMode>
     , document.getElementById('root'));
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
start().catch((error) => console.error(error));
reportWebVitals();
