namespace Animate {

    const defaultState: IEditorState = {
        showSplash: true,
        logs: []
    }

    /**
     * A reducer that processes state changes of the editor
     */
    export function editorReducer( state: IEditorState, action: IEditorAction ): IEditorState {
        switch ( action.type ) {
            case 'EA_TOGGLE_SPLASH':
                return Object.assign<IEditorState>( {}, state, { showSplash: action.showSplash });
            default:
                return defaultState;
        }
    }
}