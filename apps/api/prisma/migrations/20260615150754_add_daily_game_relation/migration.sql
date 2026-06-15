-- AddForeignKey
ALTER TABLE "daily_games" ADD CONSTRAINT "daily_games_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
