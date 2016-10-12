namespace Animate {

	/**
	 * This class describes a template. These templates are used when creating assets.
	 */
    export class AssetClass {
        private _abstractClass: boolean;
        private _name: string;
        public parentClass: AssetClass | null;
        private _imgURL: string;
        private _variables: Array<Prop<any>>;
        public classes: Array<AssetClass>;

        constructor( name: string, parent: AssetClass | null, imgURL: string, abstractClass: boolean = false ) {
            this._abstractClass = abstractClass;
            this._name = name;
            this.parentClass = parent;
            this._imgURL = imgURL;
            this._variables = [];
            this.classes = [];
        }

		/**
		 * Gets an array of all classes that are possible from this
		 */
        getClasses(): AssetClass[] {
            let toRet: AssetClass[] = [];
            let classes = this.classes!;

            for ( let childClass of classes ) {
                toRet.push( childClass );
                classes.concat( childClass.getClasses() );
            }

            return toRet;
        }

		/**
		* Creates an object of all the variables for an instance of this class.
		* @returns The variables we are editing
		*/
        buildVariables(): EditableSet {
            const toRet: EditableSet = new EditableSet( null );
            let topClass: AssetClass | null = this;
            while ( topClass !== null ) {
                //Add all the variables to the object we are returning
                for ( let i = 0; i < topClass._variables!.length; i++ ) {
                    const variable = topClass._variables![ i ];

                    // If the variable is added by a child class - then do not add it from the parent
                    // this essentially makes sure child class variables hold top priority
                    if ( !toRet.getVar( variable.name ) )
                        toRet.addVar( variable );
                }

                topClass = topClass.parentClass;
            }

            return toRet;
        }

		/**
		* Finds a class by its name. Returns null if nothing is found
		*/
        findClass( name: string ): AssetClass | null {
            if ( this._name === name )
                return this;

            const classes: Array<AssetClass> = this.classes;
            for ( let i = 0, l = classes.length; i < l; i++ ) {
                const aClass: AssetClass | null = classes[ i ].findClass( name );
                if ( aClass )
                    return aClass;
            }

            return null;
        }

		/**
		* Adds a variable to the class.
		* @param prop The property to add
		* @returns A reference to this AssetClass
		*/
        addVar( prop: Prop<any> ): AssetClass {
            this._variables.push( prop );
            return this;
        }

		/**
		* This will clear and dispose of all the nodes
		*/
        dispose() {
            for ( let i = 0, l = this._variables.length; i < l; i++ )
                this._variables[ i ].dispose();

            for ( let i = 0, l = this.classes.length; i < l; i++ )
                this.classes[ i ].dispose();

            this.parentClass = null;
        }

		/**
		* Gets a variable based on its name
		* @param name The name of the class
		*/
        getVariablesByName<T>( name: string ): Prop<T> | null {
            for ( let i = 0, l = this._variables.length; i < l; i++ )
                if ( this._variables[ i ].name === name )
                    return this._variables[ i ];

            return null;
        }

        /**
		* Gets the image URL of this template
		*/
        get imgURL(): string {
            return this._imgURL;
        }

        /**
		* Gets the variables associated with this template
		*/
        get variables(): Array<Prop<any>> {
            return this._variables;
        }

		/**
		* Adds a class
		* @param name The name of the class
		* @param img The optional image of the class
		* @param abstractClass A boolean to define if this class is abstract or not. I.e. does this class allow for creating assets or is it just the base for others.
		*/
        addClass( name: string, img: string, abstractClass: boolean ): AssetClass {
            const toAdd = new AssetClass( name, this, img, abstractClass );
            this.classes.push( toAdd );
            return toAdd;
        }

		/**
        * Gets the name of the class
        */
        get name(): string {
            return this._name;
        }

		/**
        * Gets if this class is abstract or not
        */
        get abstractClass(): boolean {
            return this._abstractClass;
        }
    }
}