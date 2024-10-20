# Testing Animations



## Use Assertions

Use assertions to impose your rules on your code. Unit test that the assertions can be triggered.



## Compare Screenshots





## Use GSAP Timeline (Advice from GreenSocks Forum)

1. You can build things with relatively short durations (0.25 seconds  or so), but be careful not to go too short because you want to allow  some tick events to fire. Not that it'd break things otherwise, but  generally when you're testing you want to reproduce something similar to real-world situations. If your tests are artificially short, you might  miss something. 
2. Make use of `onComplete`/`onUpdate`/`onStart`  callbacks to run logic that tests properties to make sure they are what  they're supposed to be. For example, if you're tweening an element's  "`left`" to `100px`, make sure it gets there by the time the `onComplete`  fires. 
3. You can build out your tests and drop them into a  `TimelineLite` sequence and set its `timeScale()` to something very high,  like `10`, so that you don't have to wait a long time. It's easy to drop  it back to `timeScale` of `1` if you want later.

Put your tweens into a `TimelineLite` (or just use the  `TimelineLite.exportRoot()` method to grab everything from the root at one time) and then you can have total random access to any spot, thus  getting the effect of "x milliseconds passed". Or set the `timeScale()` on that time line to whatever you want (to speed it  up or slow it down). 

## Maybe using an event listener in a fixture?

CSS Transitions have three events that can be listened for:

`element.addEventListener("transitionend", handler)`

Fires at the beginning of a transition before any delay:

`element.addEventListener("transitionrun", handler)`

Fires at the beginning of a transition after any delay:

`element.addEventListener("transitionstart", handler)`

Returns an array of all Animation objects currently in effect whose target elements are descendants of the `document`. This array includes CSS Animations, CSS Transitions, and Web Animations. 

`document.getAnimations()`



## Jest Mock for RequestAnimationFrame

```typescript
beforeEach(() => {
  jest.useFakeTimers()
  let count = 0
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(() => cb(100*(++count)), 100))
})

afterEach(() => {
  window.requestAnimationFrame.mockRestore()
  jest.clearAllTimers()
})
```

Directly call `cb` in `mockImplementation` will produce infinite call loop. So I make use of the Jest Timer Mocks to get it under control. Mock the timer in tests:

```typescript
act(() => {
  jest.advanceTimersByTime(200);
})
```





