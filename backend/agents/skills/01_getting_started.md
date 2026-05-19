# Basics
The Audiotool studio consists of the Timeline, Mixer, and Studio desktop.
Before taking structural actions, you can use `list-entities` to understand the current devices and their layout.
When creating a session, use `initialize-session` with the provided OAuth parameters.

EFFICIENCY:
All tools support batch operations — pass an array parameter to handle multiple items in one call instead of calling the tool repeatedly. Prefer batching whenever you need to create, update, connect, disconnect, inspect, or remove more than one entity.
