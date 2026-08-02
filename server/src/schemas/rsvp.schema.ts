import { z } from "zod";

export const EventIdParamSchema = z.object({
  eventId: z.uuid("Invalid Event ID format"),
});

export const CreateRsvpSchema = z.object({
  status: z.enum(["YES", "NO", "MAYBE"], {
    message: "Status must be 'YES', 'NO', or 'MAYBE'",
  }),
});

export type CreateRsvpDTO = z.infer<typeof CreateRsvpSchema>;
export type EventIdParamDTO = z.infer<typeof EventIdParamSchema>;
