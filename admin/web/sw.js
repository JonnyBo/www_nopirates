'use strict';
importScripts('/sw-toolbox.js');
toolbox.precache(["/", "/css/site.css"]);
toolbox.router.get('/img/*', toolbox.cacheFirst);
toolbox.router.get('/*', toolbox.networkFirst, { networkTimeoutSeconds: 5});