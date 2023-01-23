import {Middleware} from "redux";

const throttled: {[actionType: string]: boolean} = {};

export const throttleMiddleware: Middleware<any, any> = ({ getState, dispatch }) => next => action => {
    const time = action.meta && action.meta.throttle;
    if (!time)
        return next(action);
    if (throttled[action.type]) {
        return;
    }
    throttled[action.type] = true;
    setTimeout(() => {
        throttled[action.type] = false;
    }, time);
    next(action);
}
