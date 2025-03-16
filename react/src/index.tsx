import React from 'react';
import reportWebVitals from './reportWebVitals';
import {App} from "./app/App";
import {createRoot} from "react-dom/client";
import '@fontsource/roboto/400.css';
import {RecoilRoot} from "recoil";
import {DevSupport} from "@react-buddy/ide-toolbox";
import {ComponentPreviews, useInitial} from "./dev";
import { ThemeProviderWrapper } from './app/ThemeContext';


const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <RecoilRoot>
            {/*<RecoilDevTools forceSerialize={false} />*/}
            <ThemeProviderWrapper>
                <DevSupport ComponentPreviews={ComponentPreviews}
                            useInitialHook={useInitial}
                >
                    <App/>
                </DevSupport>
            </ThemeProviderWrapper>
        </RecoilRoot>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//start().catch((error) => console .error1(error));
reportWebVitals();

