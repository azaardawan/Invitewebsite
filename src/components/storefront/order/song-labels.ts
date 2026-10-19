import type { getTranslations } from 'next-intl/server';

type StoreT = Awaited<ReturnType<typeof getTranslations<'store'>>>;

/** The texts of SongUpload, in the page's language; `published`: changing the song of a live invitation. */
export function songLabels(t: StoreT, published = false) {
  return {
    title: t('song.title'),
    help: published ? t('song.helpPublished') : t('song.help'),
    designSong: t('song.designSong'),
    noSong: t('song.noSong'),
    yours: t('song.yours'),
    choose: t('song.choose'),
    change: t('song.change'),
    remove: t('song.remove'),
    start: t('song.start'),
    range: t.raw('song.range') as string,
    firstPart: t('song.firstPart'),
    listen: t('song.listen'),
    stop: t('song.stop'),
    confirm: t('song.confirm'),
    save: t('song.save'),
    cancel: t('song.cancel'),
    uploading: t.raw('song.uploading') as string,
    preparing: t('song.preparing'),
    errors: {
      tooLarge: t('song.errors.tooLarge'),
      unsupportedAudio: t('song.errors.unsupportedAudio'),
      confirm: t('song.errors.confirm'),
      rateLimited: t('song.errors.rateLimited'),
      generic: t('song.errors.generic'),
    },
  };
}
