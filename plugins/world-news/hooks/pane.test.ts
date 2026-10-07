import { describe, expect, mock, test } from 'claude-code/testing'

const START = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const headline = {
  category: '1',
  title: '美國退出世衛組織後搶補位',
  url: 'https://news.google.com/rss/articles/CBMiUEFVX3lxTFBSbUpWN0N?oc=5',
  source: 'UDN',
  rank: 0,
  publishedAt: 0,
  foundAt: 0,
}

describe('新聞側邊欄', () => {
  test('畫出標題，標題是連結', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { state: { categories: ['1'], latest: [headline], lastCheck: 0 } })
    on('session.start', (_$, e) => ({ cwd: e.cwd }))
    on('command.register', (_$, e) => ({ value: { command: e.name } }))
    on('ui.status', () => ({ value: undefined }))
    await $.session.start(START)

    const ui = await $.ui.mount({
      plugin: 'world-news',
      surface: 'terminal',
      component: 'Pane',
      requestId: 'world-news',
      props: {
        title: '新聞大事',
        isFocused: true,
        bodyColumns: 48,
        placement: 'dock',
        scroll: { top: 0, height: 20, contentHeight: 20 },
      },
    } as never)
    expect(await ui.findAll({ text: /世衛/ })).not.toEqual([])
    expect(await ui.findAll({ type: 'Link' })).not.toEqual([])
  })
})
