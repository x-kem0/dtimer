// Commands:
// <time interval> <name> - Add block for time
// repeat <count> - repeat current buffer x times
// flush - flush buffer
// rmlast - remove last entry (usually for trailing rest)

import type { TimeSlot } from "./timer"

export const calculateDuration = (slots: Array<TimeSlot>) => {
    let duration = 0;
    for (let i = 0; i < slots.length; i++) duration += slots[i].duration;

    return duration;
};

const parseTime = (time: String) => {
    if (time.endsWith("ms")) {
        return Number.parseInt(
            time.slice(0, -2)
        )
    } else if (time.endsWith("s")) {
        return Number.parseInt(
            time.slice(0, -1)
        ) * 1000
    } else if (time.endsWith("m")) {
        return Number.parseInt(
            time.slice(0, -1)
        ) * 60_000
    } else if (time.endsWith("h")) {
        return Number.parseInt(
            time.slice(0, -1)
        ) * 3600_000
    } else if (time.endsWith("hr")) {
        return Number.parseInt(
            time.slice(0, -2)
        ) * 3600_000
    } else {
        throw "invalid timebase"
    }
}

export const parseIntervals = (intervals: string) => {
    let buffer: Array<TimeSlot> = []
    let timeSlots: Array<TimeSlot> = []
    const lines = intervals.split("\n")
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase().trim()
        if (line == "" || line.startsWith("#")) continue

        const sections = line.split(" ")
        if (line.startsWith("repeat")) {
            const count = Number.parseInt(sections[1])
            if (count <= 0) throw "invalid repeat"

            for (let i = 0; i < count; i++) {
                timeSlots = timeSlots.concat(buffer)
            }
            buffer = []
        } else if (line == "flush" || line == "cb") {
            timeSlots = timeSlots.concat(buffer)
            buffer = []
        } else if (line == "rmlast") {
            if (buffer.length == 0)
                timeSlots.pop()
            else
                buffer.pop()
        } else if (sections.length == 2) {
            const duration = parseTime(sections[0])
            const name = sections[1]
            buffer.push({
                name: name,
                duration: duration
            })
        } else if (line.startsWith("r")) {
            const count = Number.parseInt(line.slice(1))
            if (count <= 0) throw `${i + 1}: invalid repeat`

            for (let i = 0; i < count; i++) {
                timeSlots = timeSlots.concat(buffer)
            }
            buffer = []

        } else {
            throw `${i + 1}: invalid line`
        }
    }

    timeSlots = timeSlots.concat(buffer)

    return timeSlots
}