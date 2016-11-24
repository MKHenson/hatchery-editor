import { IUserAction } from '../actions/user-actions';
import { UserPlan } from '../setup/enums';

const defaultMetaState: HatcheryServer.IUserMeta = {
    bio: '',
    plan: UserPlan.Free,
    image: 'media/blank-user.png',
    maxProjects: 0,
    website: ''
}

const defaultUserState: HatcheryEditor.IUser = {
    entry: null,
    error: null,
    isLoggedIn: false,
    loading: false,
    meta: defaultMetaState,
    serverResponse: null
}

/**
 * A reducer for processing project actions
 */
export function userReducer( state: HatcheryEditor.IUser = defaultUserState, action: IUserAction ): HatcheryEditor.IUser {
    let toReturn = state;

    switch ( action.type ) {
        case 'USER_REQUEST_PENDING':
            toReturn = Object.assign<HatcheryEditor.IUser>( {}, toReturn, { loading: true, error: null });
            break;
        case 'USER_REQUEST_REJECTED':
        case 'USER_AUTHENTICATED':
        case 'USER_LOGGED_IN':
        case 'USER_GET_PROJECTS':
        case 'USER_PASSWORD_RESET':
        case 'USER_ACTIVATION_RESENT':
        case 'USER_REGISTRATION_SENT':
        case 'USER_REQUEST_FULFILLED':
            toReturn = Object.assign<HatcheryEditor.IUser>( {}, toReturn, { loading: false }, action.userData! );
            break;
        case 'USER_LOGIN_FAILED':
            toReturn = Object.assign<HatcheryEditor.IUser>( {}, toReturn, {
                loading: false,
                isLoggedIn: false,
                meta: Object.assign<HatcheryServer.IUserMeta>( {}, defaultMetaState )
            }, action.userData! );
            break;
        case 'USER_LOGGED_OUT':
            toReturn = Object.assign<HatcheryEditor.IUser>( {}, defaultUserState, {
                meta: Object.assign<HatcheryServer.IUserMeta>( {}, defaultMetaState )
            });
            break;
    }

    return toReturn;
}