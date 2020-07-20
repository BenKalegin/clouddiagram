///<reference path="Events.ts" />

module Five {

    export class AnimationDoneEvent extends BasicEvent {
        
    }

    export class Animation{
        constructor(private delay: number = 20) {
        }

        /** Reference to the thread while the animation is running. */
        private thread: number = null;

        /** Returns true if the animation is running. */
        private isRunning(): boolean {
            return this.thread != null;
        }

        public onDone = new EventListeners<AnimationDoneEvent>();

        /** Starts the animation by repeatedly invoking updateAnimation. */
        startAnimation() {
            if (this.thread == null) {
                this.thread = window.setInterval(() => this.updateAnimation, this.delay);
            }
        }

        updateAnimation() {
        }

        stopAnimation() {
            if (this.thread != null) {
                window.clearInterval(this.thread);
                this.thread = null;
                this.onDone.fire(new AnimationDoneEvent());
            }
        }
    }    
}

