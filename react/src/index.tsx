import React from 'react';
import reportWebVitals from './reportWebVitals';
import {App} from "./app/App";
import {createRoot} from "react-dom/client";
import '@fontsource/roboto/400.css';
import {RecoilRoot} from "recoil";




const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
        <React.StrictMode>
            <RecoilRoot>
            <App/>
            </RecoilRoot>
        </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//start().catch((error) => console .error(error));
reportWebVitals();

