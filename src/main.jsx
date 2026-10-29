import React from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from './i18n.jsx';
import LayoutStudio from './LayoutStudio.jsx';
import './style.css';
createRoot(document.getElementById('root')).render(<I18nProvider><LayoutStudio/></I18nProvider>);
