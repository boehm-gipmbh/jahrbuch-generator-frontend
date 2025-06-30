import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {Login} from './auth';
import {InitialPage} from './InitialPage';
import {Bilder} from './bilder';
import {Users} from './users';

export const App = () => (
    <BrowserRouter>
        <Routes>
            <Route exact path='/' element={<Navigate to='/bilder/pending' />} />
            {/*<Route exact path='/' element={<Navigate to='/initial-page' />} />*/}
            <Route exact path='/login' element={<Login />} />
            <Route exact path='/initial-page' element={<InitialPage />} />
            <Route exact path='/bilder/pending'
                   element={<Bilder title='Bilder' filter={t => !Boolean(t.deleted)} />} />
            <Route exact path='/users' element={<Users />} />
        </Routes>
    </BrowserRouter>
);
