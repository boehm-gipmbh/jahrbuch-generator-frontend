import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {Login} from './auth';

import {Bilder} from './bilder';
import {Texte} from './texte';
import {Users} from './users';
import {Story} from "./stories/Story";
import {Papierkorb} from "./papierkorb/Papierkorb";

export const App = () => (
    <BrowserRouter>
        <Routes>

            <Route exact path='/' element={<Navigate to='/bilder' />} />

            <Route exact path='/login' element={<Login />} />

            <Route exact path='/texte' element={<Texte />} />
            <Route exact path='/texte/story/:storyId' element={<Texte />} />
            <Route exact path='/bilder' element={<Bilder />} />
            <Route exact path='/bilder/story/:storyId' element={<Story />} />
            <Route exact path='/papierkorb' element={<Papierkorb />} />
            <Route exact path='/users' element={<Users />} />
            {/*<Route exact path='/' element={<Navigate to='/initial-page' />} />*/}
            {/*<Route exact path='/initial-page' element={<InitialPage />} />*/}
        </Routes>
    </BrowserRouter>
);
