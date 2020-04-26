import Router from 'koa-router';
import * as PostCtrl from './posts.ctrl.js';
import checkSignIn from '../../lib/checkSignIn.js';

const posts = new Router();

posts.get('/', PostCtrl.list);
posts.post('/', checkSignIn, PostCtrl.write);

const post = new Router();
post.get('/', PostCtrl.read);
post.delete('/', checkSignIn, PostCtrl.checkPrivilege, PostCtrl.remove);
post.patch('/', checkSignIn, PostCtrl.checkPrivilege, PostCtrl.update);

posts.use('/:id', PostCtrl.getPostById, post.routes());

export default posts;
