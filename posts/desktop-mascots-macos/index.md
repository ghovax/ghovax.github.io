---
title: "Bringing Desktop Mascots to macOS with Swift"
date: "2024-03-25"
excerpt: "Implementing two desktop mascot applications in Swift: a modern recreation of the classic Neko cat that chases the mouse cursor, and a physics-based pendulum mascot using SpriteKit for realistic swinging motion."
category: "Computer Science"
tags:
  [
    "Swift",
    "macOS",
    "SpriteKit",
    "Animation",
    "Physics Simulation",
    "Desktop Applications",
  ]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of two desktop mascot applications for macOS: xNeko (a recreation of the classic cursor-chasing cat) and xMascot (a physics-based swinging mascot). This project taught me that desktop mascots are fundamentally about creating the illusion of life through simple state machines and coordinate transformations. The technical challenge lies in managing window properties to create transparent, always-on-top overlays while implementing smooth animations that respond to user interaction. I learned that macOS window management requires careful configuration to achieve the effect of a sprite living on the desktop rather than in a traditional window. Working with Swift and SwiftUI for xNeko versus SpriteKit for xMascot revealed the trade-offs between declarative UI frameworks and specialized game engines. Most importantly, I discovered that making something feel alive requires surprisingly little code when you get the animation timing and state transitions right.

Desktop mascots have a long history in computing, with the original Neko (Japanese for "cat") created by Kenji Gotoh in 1989 for the NEC PC-9801. The concept is simple but charming: a small animated character lives on your desktop, following the mouse cursor around the screen. When the cursor stops, the cat stops and eventually falls asleep. The appeal lies in the personality conveyed through just a few animation states and simple movement logic.

The challenge was to recreate this experience on modern macOS while adding my own variations: faithful recreation of the classic Neko behavior with multiple character sprites, transparent borderless windows that ignore mouse events, smooth sprite animation with proper frame timing, and a second application exploring physics-based animation with pendulum motion. Each aspect required understanding both macOS windowing APIs and animation techniques.

# Window Configuration for Desktop Overlays

Both applications require creating windows that appear to float on the desktop rather than behaving like traditional application windows. This involves careful manipulation of window properties through AppKit. The key is making windows that are transparent, frameless, always on top, and non-interactive with the mouse (except when we want interaction).

For xNeko, I configure the window in the `AppDelegate` immediately after launch:

```swift
func hideTitleBar() {
    guard let window = NSApplication.shared.windows.first else {
        assertionFailure()
        return
    }

    NSApplication.shared.activate(ignoringOtherApps: true)

    window.setFrame(
        NSRect(
            x: window.screen!.frame.width / 2,
            y: window.screen!.frame.height / 2,
            width: 40,
            height: 40
        ),
        display: true
    )
    window.backingType = .buffered
    window.canHide = true
    window.level = .floating
    window.isMovableByWindowBackground = false
    window.ignoresMouseEvents = true
    window.isOpaque = false
    window.titlebarAppearsTransparent = true
    window.backgroundColor = .clear
    window.hasShadow = false
    window.styleMask.remove(.resizable)

    let closeButton = window.standardWindowButton(.closeButton)!
    closeButton.isEnabled = false
    closeButton.isHidden = true

    let miniButton = window.standardWindowButton(.miniaturizeButton)!
    miniButton.isHidden = true
    miniButton.isEnabled = false

    let zoomButton = window.standardWindowButton(.zoomButton)!
    zoomButton.isHidden = true
    zoomButton.isEnabled = false
}
```

The window level `.floating` ensures it stays above normal windows but below system alerts. Setting `ignoresMouseEvents = true` allows clicking through the window to interact with applications underneath. The transparent title bar and clear background create the illusion that the sprite is directly on the desktop. Disabling the standard window buttons (close, minimize, zoom) removes all traditional window chrome.

For xMascot, the configuration is similar but the window is larger ($265 \times 320$ pixels) and positioned in the upper-right corner to accommodate the swinging chain visualization:

```swift
window.setFrame(
    NSRect(
        x: window.screen!.frame.width - 205,
        y: window.screen!.frame.height,
        width: 265,
        height: 320
    ),
    display: true
)
```

The critical insight is that these aren't traditional application windows. They're overlays that happen to use the window system's rendering pipeline while opting out of most window management features.

# xNeko: State Machine and Cursor Tracking

The Neko mascot implements a finite state machine with $18$ distinct states corresponding to different animations: `stop` (idle), `jare` (scratching behind ear), `kaki` (scratching body), `akubi` (yawning), `sleep` (sleeping), `awake` (waking up), eight directional movement states (`umove`, `dmove`, `lmove`, `rmove`, `ulmove`, `urmove`, `dlmove`, `drmove`), and four directional stop states (`utogi`, `dtogi`, `ltogi`, `rtogi`).

Each state has associated sprite frames stored in animation dictionaries:

```swift
nekoAnimations = [
    "stop": ["mati2"],
    "jare": ["jare2", "mati2"],
    "kaki": ["kaki1", "kaki2"],
    "akubi": ["mati3"],
    "sleep": ["sleep1", "sleep2"],
    "awake": ["awake"],
    "umove": ["up1", "up2"],
    "dmove": ["down1", "down2"],
    "lmove": ["left1", "left2"],
    "rmove": ["right1", "right2"],
    "ulmove": ["upleft1", "upleft2"],
    "urmove": ["upright1", "upright2"],
    "dlmove": ["dwleft1", "dwleft2"],
    "drmove": ["dwright1", "dwright2"],
    "utogi": ["utogi1", "utogi2"],
    "dtogi": ["dtogi1", "dtogi2"],
    "ltogi": ["ltogi1", "ltogi2"],
    "rtogi": ["rtogi1", "rtogi2"],
].mapValues { createImageArray(imageNames: $0) }
```

The core game loop runs on a timer at $0.15$ second intervals (approximately $6.67$ FPS for state updates, though sprite animation alternates giving perceived $13.34$ FPS):

```swift
Timer.scheduledTimer(withTimeInterval: 0.15, repeats: true) { _ in
    timerAction()
}
```

Each timer tick updates the animation frame, checks the cursor position, and potentially transitions states. The cursor tracking calculates a displacement vector from the window to the mouse:

```swift
func calculateDisplacement(frameOrigin: CGVector) {
    let mouse = NSEvent.mouseLocation
    let delta = CGVector(
        dx: floor(Double(mouse.x - frameOrigin.dx) - 20.0),
        dy: floor(Double(mouse.y - frameOrigin.dy) - 45.0)
    )

    let length = hypotf(Float(delta.dx), Float(delta.dy))

    if length != 0.0 {
        if length <= 13.0 {
            displacement = delta
        } else {
            displacement = (13.0 * delta) / CGFloat(length)
        }
    } else {
        displacement = CGVector()
    }
}
```

The displacement is clamped to a maximum magnitude of $13$ pixels per frame, preventing the cat from teleporting large distances. When the cursor is within $13$ pixels, the cat moves exactly to the cursor position. Otherwise, it moves $13$ pixels toward the cursor.

Direction calculation uses the displacement vector to determine which of the $8$ directional movement states to enter. This is done by calculating the angle and using threshold values:

```swift
func calculateDirection() {
    if displacement == CGVector.zero {
        setStateTo("stop")
    } else {
        let length = hypotf(Float(displacement.dx), Float(displacement.dy))
        let sinTheta = Float(displacement.dy) / length

        if displacement.dx > 0 {
            if sinTheta > 0.9239 {  // ~67.5 degrees
                setStateTo("umove")
            } else if sinTheta > 0.3827 {  // ~22.5 degrees
                setStateTo("urmove")
            } else if sinTheta > -0.3827 {
                setStateTo("rmove")
            } else if sinTheta > -0.9239 {
                setStateTo("drmove")
            } else {
                setStateTo("dmove")
            }
        } else {
            // Mirror logic for leftward movement
            if sinTheta > 0.9239 {
                setStateTo("umove")
            } else if sinTheta > 0.3827 {
                setStateTo("ulmove")
            } else if sinTheta > -0.3827 {
                setStateTo("lmove")
            } else if sinTheta > -0.9239 {
                setStateTo("dlmove")
            } else {
                setStateTo("dmove")
            }
        }
    }
}
```

The threshold values ($0.9239$, $0.3827$) correspond to sine values at $22.5$-degree increments, dividing the circle into $8$ equal sectors. This ensures smooth directional transitions as the cat follows the cursor.

The idle behavior implements a sequence of states that trigger when the cursor stops moving:

```swift
if state == "stop" {
    if shouldBeMoving {
        setStateTo("awake")
    } else if stateCount < 2 {
        // Wait
    } else {
        setStateTo("jare")
    }
} else if state == "jare" {
    if shouldBeMoving {
        setStateTo("awake")
    } else if stateCount < 2 {
        // Wait
    } else {
        setStateTo("kaki")
    }
} else if state == "kaki" {
    if shouldBeMoving {
        setStateTo("awake")
    } else if stateCount < 4 {
        // Wait
    } else {
        setStateTo("akubi")
    }
} else if state == "akubi" {
    if shouldBeMoving {
        setStateTo("awake")
    } else if stateCount < 2 {
        // Wait
    } else {
        setStateTo("sleep")
    }
} else if state == "sleep" {
    if shouldBeMoving {
        setStateTo("awake")
    }
}
```

The cat progresses through idle animations (stop, scratch ear, scratch body, yawn, sleep) with delays between each state. Any cursor movement interrupts the sequence by transitioning to "awake", which then checks the cursor position and enters a movement state if needed.

# Multiple Character Support

xNeko includes six different characters, each with complete sprite sets: Neko (the original cat), Sakura (from Cardcaptor Sakura), Dog (a puppy variant), Tomoyo (also from Cardcaptor Sakura), BSD Demon (the BSD mascot), and Tora (a tiger variant). Each character has $32$-$40$ individual sprite frames covering all animation states.

The character selection is implemented through SwiftUI's Settings panel:

```swift
Settings {
    SettingsView().environmentObject(settingsData)
}

struct SettingsView: View {
    @State var options = ["Neko", "Sakura", "Dog", "Tomoyo", "BSD Demon", "Tora"]
    @EnvironmentObject var settingsData: SettingsData

    var body: some View {
        Picker("Select a character", selection: $settingsData.selectedItem) {
            ForEach(options, id: \.self) { item in
                Text(item)
            }
        }
        .padding(20)
        .frame(width: 275, height: 75)
    }
}
```

The selected character is stored in an `@Published` property of `SettingsData`, which is observed by the main view. When the selection changes, the animation dictionary is swapped:

```swift
let selectedCharacter = settingsData.selectedItem

if selectedCharacter != currentCharacter {
    currentCharacter = selectedCharacter
    if selectedCharacter == "Neko" {
        animations = nekoAnimations
    } else if selectedCharacter == "Sakura" {
        animations = sakuraAnimations
    } else if selectedCharacter == "Dog" {
        animations = dogAnimations
    } else if selectedCharacter == "Tomoyo" {
        animations = tomoyoAnimations
    } else if selectedCharacter == "BSD Demon" {
        animations = bsdAnimations
    } else if selectedCharacter == "Tora" {
        animations = toraAnimations
    }
}
```

This approach keeps the state machine logic identical across characters while allowing complete visual customization. Each sprite set maintains the same naming convention (e.g., `mati2_sakura`, `up1_dog`) so the animation dictionary lookups work uniformly.

# xMascot: Physics-Based Pendulum Simulation

While xNeko uses discrete states and position tracking, xMascot implements continuous physics simulation using SpriteKit. The mascot hangs from a chain and swings back and forth like a pendulum when disturbed. This creates a more dynamic, physics-driven animation.

The physics simulation uses the standard pendulum equation. For a pendulum at angle $\theta$ from vertical, the angular acceleration is:

$$\alpha = -\frac{g}{L} \sin(\theta)$$

where $g$ is gravitational acceleration and $L$ is the pendulum length. In my implementation, I use normalized units where gravity constant is $0.02$ and the radius (length) varies per chain link:

```swift
class Mascot : SKSpriteNode {
    var acceleration = 0.0
    var angle = 0.0
    var velocity = 0.0
    var radius = 160.0
    var damping = 0.97

    func update() {
        let gravity = 0.02
        acceleration = -1 * gravity * sin(angle)
        velocity += acceleration
        angle += velocity
        velocity *= damping
        zRotation = angle

        position = CGPoint(
            x: radius * sin(angle),
            y: -radius * cos(angle) + 120
        )
    }
}
```

The damping factor ($0.97$) represents energy loss from air resistance and friction, causing the pendulum to gradually slow down. Without damping, it would swing forever. The position is calculated using polar-to-Cartesian conversion, with the origin offset by $120$ pixels to position the pivot point correctly in the window.

The chain consists of seven individual links, each simulated as a separate pendulum with different radii:

```swift
for i in 1...7 {
    let singleChainLink = SingleChainLink(
        givenRadius: Double(i * 20),
        givenSmoothingFactor: pow(Double(i) / 7, 0.05)
    )
    addChild(singleChainLink)
}
```

Each link is positioned at radius $20i$ pixels from the pivot. The smoothing factor creates a cascading effect where links further from the pivot have slightly different damping, making the chain appear more flexible and realistic. The chain links use a modified update that includes the smoothing:

```swift
class SingleChainLink : SKSpriteNode {
    var smoothingFactor = 1.0

    func update() {
        let gravity = 0.02
        acceleration = -1 * gravity * sin(angle)
        velocity += acceleration
        angle += velocity
        angle *= smoothingFactor  // Additional smoothing for chain effect

        velocity *= damping
        zRotation = angle

        position = CGPoint(
            x: radius * sin(angle),
            y: -radius * cos(angle) + 120
        )
    }
}
```

The mascot can be set swinging either by pressing the spacebar or automatically via a timer:

```swift
Timer.scheduledTimer(
    withTimeInterval: 600 * Double.random(in: 0.75...1.25),
    repeats: true
) { _ in
    self.timerAction()
}

func timerAction() {
    if Double.random(in: 0.0...1.0) > 0.75 {
        swingingSwitch = true
        spinAll()
    }
}

func spinAll() {
    mascot.spin()
    for link in self.children {
        if link.name == "single_chain_link" {
            let linkSprite = link as! SingleChainLink
            linkSprite.spin()
        }
    }
}
```

The timer triggers roughly every $10$ minutes (with $\pm 25$% variation), and has a $25$% chance of starting a swing. The `spin()` function gives the mascot an initial velocity:

```swift
func spin() {
    velocity = 0.12
}
```

This initial velocity ($0.12$ radians per frame at $60$ FPS, or approximately $7.2$ radians per second) determines the amplitude of the swing. The update loop runs at SpriteKit's default $60$ FPS, providing smooth physics simulation.

The simulation stops automatically when velocity drops below a threshold:

```swift
override func update(_ currentTime: TimeInterval) {
    if swingingSwitch {
        updateAll()
    }

    if abs(mascot.velocity) < 0.00001 {
        swingingSwitch = false
    }
}
```

This conserves CPU cycles when the mascot is at rest, only running physics calculations when actually swinging.

# Sprite Animation and Rendering

Both applications use sprite-based rendering, but with different approaches. xNeko uses SwiftUI's `Image` view with frame-by-frame animation controlled by a timer. The sprites are stored in the asset catalog and loaded into arrays:

```swift
func createImageArray(imageNames: NSArray) -> NSArray {
    let images = NSMutableArray()

    for imageName in imageNames {
        let image = NSImage(named: imageName as! NSImage.Name)
        images.add(image as Any)
    }

    return images
}
```

Each animation state maps to an array of frames. The current frame is selected based on the tick count:

```swift
let imageArray = animations![state]!
if state != "sleep" {
    setImageTo(imageObject: imageArray.object(at: tickCount % imageArray.count) as! NSImage)
} else {
    setImageTo(imageObject: imageArray.object(at: (tickCount >> 2) % imageArray.count) as! NSImage)
}
```

The sleep animation uses `(tickCount >> 2)`, which divides by $4$, making it run at $\frac{1}{4}$ speed for a slower breathing effect.

To maintain pixel-perfect rendering (preventing sprite blur), I use nearest-neighbor interpolation:

```swift
Image(nsImage: image)
    .interpolation(.none)  // Disable antialiasing
    .blendMode(.sourceAtop)
```

xMascot uses SpriteKit's built-in sprite rendering, which handles texture filtering automatically:

```swift
let texture = SKTexture(imageNamed: "kuma")
texture.filteringMode = .nearest

super.init(texture: texture, color: .clear, size: texture.size())
```

Setting `filteringMode = .nearest` achieves the same pixel-perfect rendering. SpriteKit's rendering pipeline is more efficient for multiple sprites (the chain links and mascot), while SwiftUI is simpler for the single-sprite xNeko.

# Vector Mathematics for Animation

xNeko extends `CGVector` with mathematical operations to simplify displacement calculations:

```swift
extension CGVector: AdditiveArithmetic {
    public static func + (left: CGVector, right: CGVector) -> CGVector {
        return CGVector(dx: left.dx + right.dx, dy: left.dy + right.dy)
    }

    public static func - (left: CGVector, right: CGVector) -> CGVector {
        return left + (-right)
    }

    public static func += (left: inout CGVector, right: CGVector) {
        left = left + right
    }

    public static func -= (left: inout CGVector, right: CGVector) {
        left = left - right
    }

    public static prefix func - (vector: CGVector) -> CGVector {
        return CGVector(dx: -vector.dx, dy: -vector.dy)
    }
}

extension CGVector {
    public static func * (left: CGFloat, right: CGVector) -> CGVector {
        return CGVector(dx: right.dx * left, dy: right.dy * left)
    }

    public static func / (left: CGVector, right: CGFloat) -> CGVector {
        guard right != 0 else { fatalError("Division by zero") }
        return CGVector(dx: left.dx / right, dy: left.dy / right)
    }
}
```

These extensions enable natural vector arithmetic:

```swift
position += displacement  // Move window by displacement vector
let normalized = displacement / length  // Normalize to unit vector
let scaled = 13.0 * normalized  // Scale to maximum speed
```

This makes the animation code more readable and less error-prone compared to manually manipulating `dx` and `dy` components.

# Performance and Resource Usage

Desktop mascots run continuously in the background, so resource usage is a concern. xNeko's timer runs at $6.67$ FPS, which is very light on CPU. The main expense is the `NSEvent.mouseLocation` call every frame and the window position updates. On my MacBook Pro, xNeko uses less than $1$% CPU when idle and around $2$-$3$% when actively moving.

xMascot runs at $60$ FPS when swinging due to SpriteKit's game loop, but only updates physics when `swingingSwitch` is true. When at rest (most of the time), it drops to minimal CPU usage. During active swinging, it uses $5$-$8$% CPU, which is acceptable for a desktop toy.

Memory footprint is dominated by sprite textures. xNeko loads all sprites for all characters upfront (around $200$ individual $32 \times 32$ pixel images), consuming approximately $15$ MB. xMascot is lighter at $3$-$4$ MB since it only has a few sprites and chain links.

Both applications use transparent overlays, which require compositor resources but modern macOS handles this efficiently. Window transparency is hardware-accelerated through Metal, so there's no significant performance penalty.

# Lessons Learned

Building these desktop mascots taught me several lessons about animation and macOS development. First, state machines are powerful for character animation. The xNeko behavior emerges from just $18$ states and simple transition rules, yet it feels alive and responsive. Breaking animations into discrete states makes the code maintainable and easy to extend with new behaviors.

Second, window management on macOS offers surprising flexibility. By carefully configuring window properties, you can create overlays that blend seamlessly with the desktop environment. The key is understanding which properties to enable (floating level, transparency) and which to disable (title bar, resizing, mouse interaction).

Third, physics simulation doesn't require complex frameworks. The pendulum motion in xMascot uses basic trigonometry and just a few lines of code per frame, yet produces convincing swinging motion. The damping factor is critical for making it feel realistic rather than perpetually energetic.

Finally, sprite animation is about timing as much as artwork. The sleep animation running at $\frac{1}{4}$ speed conveys a completely different mood than the normal movement states. Small details like this make characters feel more alive.

---

Implementing desktop mascots demonstrates how simple animation principles create engaging interactive experiences. The classic Neko concept remains charming decades after its creation because it taps into fundamental human tendency to anthropomorphize and interact with animated characters. The physics-based pendulum mascot shows how continuous simulation can complement discrete state machines for different animation styles. Both projects served as explorations of macOS windowing capabilities and Swift animation techniques, proving that you don't need complex game engines to create delightful desktop companions. Understanding how each component works, from window transparency to pendulum physics, provides appreciation for the engineering behind seemingly simple animated characters that have entertained computer users for over three decades.
