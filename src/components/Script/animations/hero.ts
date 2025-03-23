import { Anticipate } from './anticipate'
import { gsap } from 'gsap'

export const heroSvgAnimation = () => {
  if (document.getElementById('heroAnimation') == undefined) return

  gsap.set('.monitorBottom', {
    transformOrigin: '50% 100%',
  })

  gsap.set(['.monitorStand', '.laptopBase', '.tabletScreen'], {
    transformOrigin: '50% 0%',
  })

  gsap.set(
    [
      '.monitorLogo',
      '.monitorScreen',
      '.laptopScreen',
      '.laptopTrackpad',
      '.tabletGroup',
      '.laptopGroup',
      '.tabletButton',
      '.tabletCamera',
      '.tabletContentGroup',
      '.phoneButton',
      '.phoneCamera',
      '.phoneSpeaker',
      '.laptopContentGroup',
      '.phoneGroup',
    ],
    {
      transformOrigin: '50% 50%',
    }
  )

  gsap.set(['.laptopEdgeLeft', '.laptopEdgeRight'], {
    transformOrigin: '0% 100%',
  })

  gsap.set('.tabletGroup', {
    rotation: -90,
  })

  gsap.set('svg', {
    visibility: 'visible',
  })

  gsap
    .timeline({
      defaults: { duration: 1 },
      delay: 1,
      paused: !1,
      repeat: -1, // repeat indefinitely
      yoyo: !1,
    })
    .timeScale(3)
    .from('.monitorBottom', {
      scaleY: 0,
      ease: 'power1',
    })
    .from(
      '.monitorStand',
      {
        y: -70,
        ease: 'power1',
      },
      '-=1'
    )
    .from(
      '.monitorStandShadow',
      {
        duration: 0.5,
        alpha: 0,
        ease: 'power1.in',
      },
      '-=0.5'
    )
    .from(
      '.monitorEdge',
      {
        y: 330,
      },
      '-=0.25'
    )
    .from(
      '.monitorScreen',
      {
        duration: 2,
        y: 330,
        ease: 'power1',
      },
      '-=1'
    )
    .staggerFrom(
      '.monitorContentGroup path',
      1,
      {
        scaleX: 0,
      },
      0.1
    )
    .from('.monitorLogo', {
      scale: 0,
      ease: 'back(2)',
    })
    .to('.monitorContentGroup path', {
      alpha: 0,
      delay: 2,
      stagger: { each: 0.1 },
    })
    .to(
      '.monitorScreen',
      {
        y: 330,
        ease: 'power1.in',
      },
      '-=1'
    )
    .to(
      '.monitorEdge',
      {
        y: 330,
        ease: 'power1.in',
      },
      '-=0.75'
    )
    .to('.monitorBottom', {
      scaleX: 0.69,
      y: -23,
    })
    .to(
      '.monitorBottom',
      {
        scaleY: 0.45,
        alpha: 1,
      },
      '-=1'
    )
    .set('.monitorBottom', {
      alpha: 0,
    })
    .to(
      '.monitorLogo',
      {
        duration: 0.5,
        scale: 0,
        ease: 'back.in',
      },
      '-=1'
    )
    .to(
      '.monitorStand',
      {
        y: -120,
      },
      '-=1.5'
    )
    .to(
      '.monitorStandShadow',
      {
        duration: 0.5,
        alpha: 0,
      },
      '-=1.5'
    )
    .from(
      '.laptopBase',
      {
        alpha: 0,
      },
      '-=1'
    )
    .from(
      '.laptopTrackpad',
      {
        scaleX: 0,
      },
      '-=1'
    )
    .from('.laptopScreen', {
      scale: 0,
      ease: 'back(0.5)',
    })
    .from(
      '.laptopEdgeLeft',
      {
        duration: 2,
        skewX: -40,
        scaleY: 0,
        ease: 'power3',
      },
      '-=2'
    )
    .from(
      '.laptopEdgeRight',
      {
        duration: 2,
        skewX: 40,
        scaleY: 0,
        ease: 'power3',
      },
      '-=2'
    )
    .staggerFrom(
      '.laptopContentGroup path',
      1,
      {
        scaleX: 0,
      },
      0.1
    )
    .to('.laptopTrackpad', {
      duration: 0.3,
      alpha: 0,
      delay: 2,
    })
    .to('.laptopScreen', {
      scaleX: 0.67,
    })
    .to(
      '.laptopScreen',
      {
        scaleY: 0.8,
      },
      '-=1'
    )
    .to(
      '.laptopContentGroup',
      {
        alpha: 0,
        scale: 0.5,
      },
      '-=1'
    )
    .to(
      '.laptopBase',
      {
        y: -20,
        scaleX: 0,
      },
      '-=1'
    )
    .to(
      '.laptopEdgeLeft',
      {
        x: 40,
        transformOrigin: '50% 50%',
        scaleY: 0.85,
      },
      '-=1'
    )
    .to(
      '.laptopEdgeRight',
      {
        x: -40,
        transformOrigin: '50% 50%',
        scaleY: 0.85,
      },
      '-=1'
    )
    .set('.laptopGroup', {
      alpha: 0,
    })
    .from(
      '.tabletGroup',
      {
        scale: 1.1,
        alpha: 0,
      },
      '-=1'
    )
    .to('.tabletGroup', {
      duration: 2,
      rotation: 0,
      delay: 2,
      ease: Anticipate.out,
    })
    .staggerFrom(
      ['.tabletButton', '.tabletCamera'],
      0.5,
      {
        scale: 0,
        ease: 'back',
      },
      '-=1'
    )
    .from('.tabletContentGroup', {
      duration: 2,
      rotation: 90,
      scaleX: 1.33,
      scaleY: 0.8,
      ease: 'power3.inOut',
    })
    .to(['.tabletButton', '.tabletCamera'], {
      duration: 0.5,
      scale: 0,
      delay: 2,
    })
    .to('.tabletGroup', {
      scaleX: 0.45,
    })
    .to(
      '.tabletGroup',
      {
        scaleY: 0.7,
      },
      '-=1'
    )
    .to(
      '.tabletContentGroup',
      {
        y: -5,
      },
      '-=1'
    )
    .to(
      '.tabletScreen',
      {
        duration: 0.5,
        scaleY: 0.92,
        y: 4,
      },
      '-=0.5'
    )
    .set('.phoneGroup', {
      alpha: 1,
    })
    .set(['.tabletGroup', '.tabletContentGroup'], {
      alpha: 0,
    })
    .staggerFrom(
      ['.phoneButton', '.phoneCamera', '.phoneSpeaker'],
      1,
      {
        scale: 0,
        ease: 'back',
      },
      0.1
    )
    .to('.phoneGroup', {
      duration: 2,
      y: 80,
      delay: 2,
      ease: 'back.in(2)',
    })
}
