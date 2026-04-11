import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {Login, Register, VerifyEmail, ForgotPassword, ResetPassword, ForgotUsername} from './auth';

import {Bilder} from './bilder';
import {Texte} from './texte';
import {Invitations} from './users';
import {Story} from "./stories/Story";
import {Papierkorb} from "./papierkorb/Papierkorb";

export const App = () => (
    <BrowserRouter>
        <Routes>

            <Route exact path='/' element={<Navigate to='/bilder' />} />

            <Route exact path='/login' element={<Login />} />
            <Route exact path='/register' element={<Register />} />
            <Route exact path='/verify-email' element={<VerifyEmail />} />
            <Route exact path='/forgot-username' element={<ForgotUsername />} />
            <Route exact path='/forgot-password' element={<ForgotPassword />} />
            <Route exact path='/reset-password' element={<ResetPassword />} />

            <Route exact path='/texte' element={<Texte />} />
            <Route exact path='/texte/story/:storyId' element={<Texte />} />
            <Route exact path='/bilder' element={<Bilder />} />
            <Route exact path='/bilder/story/:storyId' element={<Story />} />
            <Route exact path='/papierkorb' element={<Papierkorb />} />
            <Route exact path='/users' element={<Navigate to='/invitations' />} />
            <Route exact path='/invitations' element={<Invitations />} />
            {/*<Route exact path='/' element={<Navigate to='/initial-page' />} />*/}
            {/*<Route exact path='/initial-page' element={<InitialPage />} />*/}
        </Routes>
    </BrowserRouter>
);
