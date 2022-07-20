# Pastator

## Try it

[Demo](https://court-jus.github.io/pastator/)

## See it in action

[Video](https://youtu.be/tLba4AEriVQ)

## What it is

This project is an enhanced MIDI arpeggiator, inspired by other products like [The NDLR by Conductive Labs](https://conductivelabs.com/ndlr/) or [The T-1 by Torso Electronics](https://torsoelectronics.com/t-1/). I find this type of products really inspiring and wanted to give it a try and see what I could come up with.

It consists of as many tracks as you want, each one of them sending note events to the chosen MIDI channel, the notes sent can be constrained to a scale and/or chord in that scale. Velocity for each note is decided based on a pattern that is different from the pattern of the notes themselves, this allow less repetitive motifs. Different presets are available for you to play with.

You can try it but this is not considered a finished product yet and is currently in development. That's why when firing it up, it already contains some tracks. The final product will allow saving/loading and starting from scratch.

You will need a sound generator that listens to MIDI signals and produces sounds. You will also need a MIDI clock. When running Pastator, you need to select your MIDI clock and MIDI output devices in the lists.

## Contribution

Best way to contribute is to try it and make feedback. You can also clone the repository and submit pull requests.

To develop and test locally, the easiest way to run it is via caddy (then point your browser to http://localhost:2015/)

```
caddy run --watch
```
