/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

/**
 * Non-module dependencies
 */
const {
	apiFetch,
	i18n: { __ },
} = wp;

const { actions } = store( 'booking-form', {
	actions: {
		next( e ) {
			e.preventDefault();
			const { steps } = getContext();

			const activeStep = steps.find( ( step ) => step.isActive === true );
			const nextStep = steps.find(
				( step ) => step.id === activeStep.id + 1
			);

			if ( ! nextStep ) {
				return;
			}

			performViewTransition( () => {
				activeStep.isActive = false;
				nextStep.isActive = true;
			} );
		},
		back() {
			const { steps } = getContext();

			const activeStep = steps.find( ( step ) => step.isActive === true );
			const nextStep = steps.find(
				( step ) => step.id === activeStep.id - 1
			);

			if ( ! nextStep ) {
				return;
			}

			performViewTransition( () => {
				activeStep.isActive = false;
				nextStep.isActive = true;
			} );
		},
		submit: function* () {
			const context = getContext();
			context.submitting = true;

			const title = __( 'Booking Form Submission', 'booking-form' );
			const content = actions.reviewFields().reduce( ( acc, field ) => {
				return `${ acc }<p><strong>${ field.label }</strong>: ${ field.value }</p>`;
			}, '' );

			try {
				yield apiFetch( {
					path: '/booking-form/v1/booking',
					method: 'POST',
					data: {
						title,
						content,
					},
				} );

				performViewTransition( () => {
					context.steps.forEach(
						( step ) => ( step.isActive = false )
					);
					context.submitted = true;
					context.errorMessage = '';
				} );
			} catch ( error ) {
				context.errorMessage = error.message;
			}

			context.submitting = false;
		},
		reset() {
			const context = getContext();

			performViewTransition( () => {
				context.steps.forEach( ( step ) =>
					step.fields.forEach( ( field ) => ( field.value = '' ) )
				);
				context.steps[ 0 ].isActive = true;
				context.submitted = false;
			} );
		},
		updateField( e ) {
			const { field } = getContext();
			field.value = e.target.value;
		},
		reviewFields() {
			const { steps } = getContext();
			return steps.reduce( ( acc, step ) => {
				return [ ...acc, ...step.fields ];
			}, [] );
		},
		isFirstStep() {
			const { steps } = getContext();
			return steps[ 0 ].isActive;
		},
		isLastStep() {
			const { steps } = getContext();
			return steps[ steps.length - 1 ].isActive;
		},
	},
} );

/**
 * Perform a view transition if browser supports it.
 *
 * @param {Function} callback The callback function to run after the transition.
 */
const performViewTransition = ( callback ) => {
	if ( ! document.startViewTransition ) {
		callback();
		return;
	}

	document.startViewTransition( callback );
};
