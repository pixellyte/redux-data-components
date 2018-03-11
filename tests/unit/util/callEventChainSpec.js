import callEventChain from "../../../src/util/callEventChain";

let eventHandlerA, eventHandlerC, callList;

class EventA {}
class EventB extends EventA {}
class EventC extends EventB {}

describe('callEventChain', () => {

    beforeEach(() => {
        callList = [];
        eventHandlerA = jasmine.createSpy('eventHandlerA').and.callFake(() => {
            callList.push('eventHandlerA');
        });
        EventA.prototype.eventHandler = eventHandlerA;
        eventHandlerC = jasmine.createSpy('eventHandlerC').and.callFake(() => {
            callList.push('eventHandlerC');
        });
        EventC.prototype.eventHandler = eventHandlerC;
    })

    it('calls all handler instances in ascending order', () => {
        const handler = new EventC();
        callEventChain(handler, handler, 'eventHandler', 'arg0', 'arg1');
        expect(eventHandlerA).toHaveBeenCalledWith('arg0', 'arg1');
        expect(eventHandlerC).toHaveBeenCalledWith('arg0', 'arg1');
        expect(callList).toEqual(['eventHandlerA', 'eventHandlerC']);
    })

    describe('with sparse inheritance', () => {

        it('does not call ancestor handlers redundantly', () => {
            // If implemented incorrectly, callEventChain might walk the
            // inheritance chain and, because EventB does not itself implement
            // an eventHandler, call EventA's handler twice.  The implementation
            // of callEventChain must prevent this.
            const handler = new EventC();
            const tempEventHandler = jasmine.createSpy('tempEventHandler');
            EventA.prototype.eventHandler = tempEventHandler;
            callEventChain(handler, handler, 'eventHandler', 'arg0', 'arg1');
            expect(tempEventHandler.calls.count()).toEqual(1);
        })

        it('ignores calls to unimplemented handlers', () => {
            const handler = new EventC();
            callEventChain(handler, handler, 'thisDoesNotExist');
            expect(eventHandlerA).not.toHaveBeenCalled();
            expect(eventHandlerC).not.toHaveBeenCalled();
        })

        it('calls handlers not defined on the terminal class', () => {
            delete EventC.prototype.eventHandler;
            const handler = new EventC();
            callEventChain(handler, handler, 'eventHandler', 0, 1);
            expect(eventHandlerC).not.toHaveBeenCalled();
            expect(eventHandlerA).toHaveBeenCalledWith(0, 1);
        })

    })
})