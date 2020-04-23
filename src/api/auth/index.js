import Router from 'koa-router';
import * as authCtrl from './auth.ctrl.js';

const auth = new Router();

auth.post('/signup', authCtrl.signUp);
auth.post('/signin', authCtrl.signIn);
auth.get('/check', authCtrl.userCheck);
auth.post('signout', authCtrl.signOut);

export default auth;
