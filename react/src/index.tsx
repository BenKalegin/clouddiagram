import React from 'react';
import reportWebVitals from './reportWebVitals';
import {Provider} from "react-redux";
import {store} from "./app/store";
import {App} from "./app/App";
import {createRoot} from "react-dom/client";
import '@fontsource/roboto/400.css';




const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
        <React.StrictMode>
            <Provider store={store}>
                <App/>
              </Provider>
        </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//start().catch((error) => console .error(error));
reportWebVitals();

