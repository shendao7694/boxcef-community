// @path: src/js/admin/handlers/main.js
export { bindNav } from './nav.js';
export { bindUsers, openEdit, deleteUser } from './users.js';
export { bindDisc, openUserDisc } from './disc.js';
export { bindUserTitle, openUserTitle } from './userTitle.js';
export { bindAssets, deleteAsset } from './assets.js';
export { bindVerifications, openVerifyEdit, deleteVerify } from './verifications.js';
export { bindPosts, deletePost, togglePin, openPostEdit, fillCommentPostSelect } from './posts.js';
export { bindComments, loadComments, toggleCommentPin, deleteCommentAdmin } from './comments.js';
export { bindAdvice, handleAdviceAction } from './advice.js';
export { bindSettings } from './settings.js';
export { bindDanger, bindUserIdxRebuild } from './danger.js';
export { bindAds, loadAds } from './ads.js';
export { bindTitles, loadTitles } from './titles.js';
export { bindBoxplay, loadBoxplayList } from './boxplay.js';

export function bindAllHandlers() {
  // 这个函数在 main.js 里按需调用各 bind，顺序无关
}