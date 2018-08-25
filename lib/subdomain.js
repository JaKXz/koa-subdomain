'use strict';

const debug = require('debug')('koa-subdomain');

class Subdomain {
    constructor() {
        this.subs = [];
        this.middlewares = [];
    }

    use(sub, router) {
        if (typeof sub !== 'string' || !router || typeof router !== 'function') {
            throw new Error('Missing or wrong params!');
        }

        debug('sub domains: [%s]', sub);

        this.subs.push(sub.split('.'));
        this.middlewares.push(router);

        return this;
    }

    routes() {
        let self = this;

        return function (ctx, next) {
            let subdomains = ctx.subdomains.reverse(),
                matched = self.match(subdomains);

            if (matched) {
                if (matched.wildcardSubdomain) {
                    ctx.state.wildcardSubdomain = matched.wildcardSubdomain;
                }

                return matched.middleware(ctx, next);
            }

            return next();
        }
    }

    match(subdomains) {
        let subs = this.subs,
            middlewares = this.middlewares,
            result = null,
            matched,
            sub,
            wildcardSubdomain;

        // subdomain('', router) match example.com
        if (!subdomains.length) {
            subdomains.push('');
        }

        for (let i = 0, j = subs.length; i < j; i++) {
            sub = subs[i];
            matched = true;

            if (sub.length !== subdomains.length) {
                continue;
            }

            for (let s = 0, t = sub.length; s < t; s++) {
                if (sub[s] !== subdomains[s] && sub[s] !== '*') {
                    matched = false;
                    break;
                }

                if (sub[s] === '*') {
                    wildcardSubdomain = subdomains[s];
                }
            }

            if (matched) {
                debug('match: %s', sub.join('.'));
                if (wildcardSubdomain) {
                    result = {
                        middleware: middlewares[i],
                        wildcardSubdomain: wildcardSubdomain
                    }
                    break;
                }

                result = {
                    middleware: middlewares[i]
                }
                break;
            }
        }

        return result;
    }
}

module.exports = Subdomain;