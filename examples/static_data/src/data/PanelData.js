import {AsyncFetchComponent, connect} from 'redux-data-components';

/* This is a bogus data-fetch component (to avoid doing real service calls in an example.
 * Latency is simulated by a random sleep under ten seconds, then a random number 0-99 is returned.
 */
class PanelData extends AsyncFetchComponent {
    defaultState() {
        return 0;
    }

    componentDidUpdate(prev, reason) {
        if(prev.data !== this.data) {
            // NOTE: You wouldn't normally do this.  Immediately invalidating
            //       data as soon as you receive it defeats the point of having
            //       shared/static data in your app.  However, for purposes of
            //       this demo, we want the request buttons to always fetch,
            //       but not to allow overlapping requests if the user pushes
            //       the 'RELOAD SHARED VALUE' button more than once.  This
            //       accomplishes that.
            this.invalidate()
        }
    }

    sleep(time) {
        // A promise that sleeps for a specified amount of time.
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    fetch(why) {
        return this.sleep(Math.floor(Math.random() * 10000))
            .then(() => {
                return Math.floor(Math.random() * 100);
            });
    }
}

export default connect("PanelData", PanelData);