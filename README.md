# Oral Communication Final Scheduler

This is a Vercel-ready Next.js app for the university oral communication final exam scheduling workflow.

## What it includes

- Public student sign-up page at `/`
- Evaluator availability pages at `/evaluator/kelsey`, `/evaluator/jon`, `/evaluator/sean`, and `/evaluator/thomsen`
- Instructor-only master view at `/instructor/<INSTRUCTOR_ACCESS_KEY>`
- Staff-only quick-access hub at `/access/<INSTRUCTOR_ACCESS_KEY>`
- Shared schedule persistence in a private Vercel Blob JSON file

## Required setup on Vercel

1. Create a private Vercel Blob store and connect it to this project.
2. Confirm `BLOB_READ_WRITE_TOKEN` is available in the project environment variables.
3. Set `INSTRUCTOR_ACCESS_KEY` to the private path segment you want for the master view.

## Notes

- Students can book, cancel, and reschedule by re-entering the same name they used when booking.
- Students never see evaluator assignments.
- The instructor view flags unassigned bookings until an evaluator is selected.
