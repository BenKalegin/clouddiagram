import React from 'react';
import {initializeIcons, ThemeProvider} from '@fluentui/react';
import reportWebVitals from './reportWebVitals';
import {themeNameToTheme} from "./view/Themes";
import {Provider} from "react-redux";
import {store} from "./app/store";
import {App} from "./app/App";
import {createRoot} from "react-dom/client";



const container = document.getElementById('root')!;
const root = createRoot(container);

initializeIcons();
root.render(
        <React.StrictMode>
            <Provider store={store}>
            <ThemeProvider theme={themeNameToTheme("default")}>
                <App/>
            </ThemeProvider>
              </Provider>
        </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//start().catch((error) => console.error(error));
reportWebVitals();

