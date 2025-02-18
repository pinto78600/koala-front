import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {deleteNotifs, getNotifs, getRoomChat, getUserFriend } from '../../actions/userFriend.actions';
import { UidContext } from '../AppContext';
import LeftNav from '../LeftNav';
import ChatRoom from './ChatRoom';
import FollowHandler from '../Profil/FollowHandler';
import { dateParser, isEmpty } from '../Utils';
import SearchBar from './SearchBar';
import { getPostUser } from '../../actions/post.actions';
import Card from '../Post/Card';
import { blockUser, unblockUser } from '../../actions/user.actions';

const ProfilFriend = ( { uidFriend } ) => {
    const [count, setCount] = useState(10);
    const [loadMessages, setLoadMessages] = useState(false);
    const [loadData, SetLoadData] = useState(false);  
    const [blocked, setBlocked] = useState(false);
    const [displayRoom, setDisplayRoom] = useState(false);
    
    const uid = useContext(UidContext);
    
    const dispatch = useDispatch()
    const userDataFriend = useSelector(state => state.userFriendReducer );
    const roomChat = useSelector(state => state.chatReducer );

    const postUser =  useSelector(state => state.postReducer);

    
    const createRoomAndNotif = () => {
        axios({
            method: 'post',
            url:`${process.env.REACT_APP_API_URL}api/utils/friendly`,
            withCredentials: true,
            data: {
                user : uid,
                userFriend : uidFriend,
            }
        })
        .then(res => {
            if(res.data.errors) console.log(res.data.errors);
            else setDisplayRoom(true);
            
        }).catch(err => console.log(err))
    }
    
    const handleBlocked = () => {
        setBlocked(true);
        dispatch(blockUser(uidFriend, uid));
    }
    
    const handleUnblocked = () => {
        setBlocked(false);
        dispatch(unblockUser(uidFriend, uid));
    }
    
    const handleCreate = e => {
        e.preventDefault();
        createRoomAndNotif();
    }
    
    if(loadMessages){
        setCount(count + 10);
        setLoadMessages(false)
        
    }
    
    useEffect(() => {        
        if(uidFriend) dispatch(getPostUser(uidFriend));
        
        const roomAsync = async () => {
            if(uid && uidFriend){
                dispatch(getUserFriend(uidFriend));
                await dispatch(getRoomChat(uid, uidFriend, count));
                SetLoadData(true);
            } 
        }
        roomAsync()
        if(!isEmpty(roomChat)){
            const notifs = roomChat.data[0].notifications;
            const arrNotifs = notifs.map(notif => {
                if(notif.senderId === uidFriend) return notif.senderId
                else return null
            });
            
            if(!isEmpty(arrNotifs) && roomChat.data[0]._id) {
                dispatch(deleteNotifs(roomChat.data[0]._id, uidFriend))
                if(uid) dispatch(getNotifs(uid))
            } 
        }
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadMessages, uid, dispatch, uidFriend, blocked, count]) 
    
    useEffect(() => {
        if(displayRoom){
            if(uid && uidFriend){
                dispatch(getRoomChat(uid, uidFriend, count));
                document.getElementById('chat-user').scrollIntoView();
            }
        }
    }, [displayRoom, uid, uidFriend, count, dispatch])
    
    
    return (
        <>
            <div className='profile-container'>
                <LeftNav/>
                { !uidFriend ? (
                <div>
                    <SearchBar/>
                </div>
                )
                :
                (
                    !loadData ? (
                        <div className='icon' >
                            <i className='fas fa-spinner fa-pulse'></i>
                        </div>
                    )
                    :
                    (

                    <>
                    <div className='header-profil-friend'>
                        <h1>Profil de {userDataFriend.pseudo}</h1>
                        <button onClick={() => window.location = './friendly'} >Trouver des amis</button>
                    </div>
                    <div className='update-container'>
                        <div className='left-part'>
                            <h3>Photo de profil</h3>
                            <img src={userDataFriend.picture} alt='picUserFriend'/>
                            <h1><FollowHandler idToFollow={userDataFriend._id} type={'suggestion'} /></h1>
                            {blocked && (
                                <button onClick={handleUnblocked} >Débloqué</button>
                            )}
                            {!blocked && (
                                <button onClick={handleBlocked} >Bloqué</button>
                            )}
                            {isEmpty(roomChat) &&  <form action='' onSubmit={handleCreate}>
                                        <input type='submit' value='Envoyer message' />
                                        </form>}                        
                        </div>
                        <div className='right-part' >
                            <div className='bio-update' >
                                <h3>Bio</h3>
                                <p>{userDataFriend.bio}</p>
                            </div>
                            <h4>Membre depuis le : {dateParser(userDataFriend.createdAt)}</h4>
                            <h4>Abonnements : {userDataFriend.following ? userDataFriend.following.length : ''}</h4>
                            <h4>Abonnés : {userDataFriend.followers ? userDataFriend.followers.length : ''}</h4>
                        </div>
                    </div>
                    <div className='container-post-chat' >
                        <div id='chat-user' >
                            {!isEmpty(roomChat) && (
                                  <ChatRoom 
                                        roomChat={roomChat} 
                                        count={count} 
                                        setCount={setCount}
                                        setLoadMessages={setLoadMessages}
                                        loadMessages={loadMessages}
                                    />
                                )
                            } 
                        </div>
                        <div className='post-user'>
                            <ul>
                                {!isEmpty(postUser[0]) && 
                                    postUser.map(post => {
                                        return  <Card post={post} key={post._id}/>
                                    })
                                }
                            </ul>
                        </div>
                    </div>
                    </>
                    )
                )
                }
                </div>
        </>
    );
};

export default React.memo(ProfilFriend);