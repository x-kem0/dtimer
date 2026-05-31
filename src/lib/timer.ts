import { calculateDuration } from "./interval_parse"

declare interface TimeSlot {
    name: string,
    duration: number
}

export type { TimeSlot as TimeSlot }

export class Timer {
    timerRunning: boolean
    timeRemaining: number
    totalTimeRemaining: number
    elapsedSlots: Map<string, number>
    totalSlots: Map<string, number>
    currentSlot: TimeSlot
    slots: TimeSlot[]
    lastTickDate: number
    intervalId: number
    clearCallback: Function
    tickCallback: Function
    dingCallback: Function
    advanceCallback: Function

    constructor(slots: TimeSlot[], clearCallback: Function, tickCallback: Function, dingCallback: Function, advanceCallback: Function) {
        if (slots.length == 0)
            throw new Error("no intervals specified")

        this.clearCallback = clearCallback
        this.tickCallback = tickCallback
        this.dingCallback = dingCallback
        this.advanceCallback = advanceCallback

        const firstSlot = slots[0]

        this.timerRunning = true
        this.timeRemaining = firstSlot.duration
        this.totalTimeRemaining = calculateDuration(slots)
        this.elapsedSlots = new Map<string, number>

        this.totalSlots = new Map<string, number>
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i]
            let count = this.totalSlots.get(slot.name) || 0
            this.totalSlots.set(slot.name, count + 1)
            this.elapsedSlots.set(slot.name, 0)
        }

        this.currentSlot = firstSlot
        this.elapsedSlots.set(firstSlot.name, 1)
        this.slots = slots.slice(1)
        this.lastTickDate = Date.now()

        this.intervalId = window.setInterval(() => {
            if (!this.timerRunning)
                return

            const newDate = Date.now()

            const millisElapsed = newDate - this.lastTickDate

            this.timeRemaining -= millisElapsed
            this.totalTimeRemaining -= millisElapsed

            this.tickCallback()
            if (this.timeRemaining <= 0)
                this.advance()


            this.lastTickDate = newDate
        }, 10)

        this.dingCallback()
    }

    advance() {
        const newSlot = this.slots.shift()

        if (!newSlot)
            return this.clear()

        this.elapsedSlots.set(newSlot.name, (this.elapsedSlots.get(newSlot.name) || 0) + 1)

        this.currentSlot = newSlot
        this.totalTimeRemaining -= this.timeRemaining
        this.timeRemaining = newSlot.duration
        this.tickCallback()
        this.dingCallback()
        this.advanceCallback()
    }

    clear() {
        window.clearInterval(this.intervalId)
        this.clearCallback()
    }

}
