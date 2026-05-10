import React from 'react';
import {App} from "./app/App";
import {createRoot} from "react-dom/client";
import '@benkalegin/ui26/theme.css';
import '@benkalegin/ui26/styles.css';
import './index.css';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);

