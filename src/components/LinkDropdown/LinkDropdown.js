import React from 'react'
import { Menu } from "@headlessui/react";
import doc from './icon-documents.svg'
import track from './icon-track.svg'
import hub from './icon-hub.svg'
import dots from './icon-options.svg'
import twitter from './icon-twitter.svg'
import telegram from './icon-telegram.svg'
import ins from './icon-instagram.svg'
import youtube from './icon-youtube-yt.svg'
import discord from './icon-discord.svg'
import leaderboard from './icon-leaderboard.svg'

export default function LinkDropdown() {
    return (
        <Menu>
            <Menu.Button as="div" className='flex App-header-actions'>
                {/* <button className=""> */}
                    <img src={dots} alt="" />
                {/* </button> */}
            </Menu.Button>
            <div>
                <Menu.Items as="div" className="menu-items" style={{right:'-88px'}}>
                    <Menu.Item>
                        <a href='https://docs.grizzly.fi/v/eng/product/grizzly-trade' target="_blank" rel="noopener noreferrer" className="menu-item">
                            <img src={doc} alt="" />
                            <p>Docs</p>
                        </a>
                    </Menu.Item>
                    <Menu.Item>
                        <a href='https://stats.grizzly.fi/' target="_blank" rel="noopener noreferrer" className="menu-item">
                            <img src={track} alt="" />
                            <p>Stats</p>
                        </a>
                    </Menu.Item>
                    <Menu.Item>
                        <a href='https://leaderboard.grizzly.fi/' target="_blank" rel="noopener noreferrer" className="menu-item">
                            <img src={leaderboard} alt="" width={16} height={16} />
                            <p>Leaderboard</p>
                        </a>
                    </Menu.Item>
                    <Menu.Item>
                        <a href='https://app.grizzly.fi/' target="_blank" rel="noopener noreferrer" className="menu-item">
                            <img src={hub} alt="" />
                            <p>Grizzly.fi App</p>
                        </a>
                    </Menu.Item>
                    <div className='media-links'>
                        <a href='https://twitter.com/GrizzlyFi' target="_blank" rel="noopener noreferrer"><img src={twitter} alt='' /></a>
                        <a href='https://t.me/grizzlyficommunity' target="_blank" rel="noopener noreferrer"><img src={telegram} alt='' /></a>
                        <a href='https://www.instagram.com/grizzly.fi/' target="_blank" rel="noopener noreferrer"><img src={ins} alt='' /></a>
                        <a href='https://www.youtube.com/c/Grizzly-fi' target="_blank" rel="noopener noreferrer"><img src={youtube} alt='' /></a>
                        <a href='https://discord.gg/grizzlyfi' target="_blank" rel="noopener noreferrer"><img src={discord} alt='' /></a>
                    </div>
                </Menu.Items>
            </div>
        </Menu>
    )
}
