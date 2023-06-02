from flask import Flask, request
from flask_restful import Api, Resource, reqparse, abort

app = Flask(__name__)
     
'''wrap our app in the api'''
api = Api(app)

Video_put_args = reqparse.RequestParser()
Video_put_args.add_argument("name", type=str, help="Name of the video", required=True)
Video_put_args.add_argument("views", type=int, help="Views of the video", required=True)
Video_put_args.add_argument("likes", type=int, help="Likes of the video", required=True)
 
videos ={}

'''manages if video does not exist'''
def video_not_exist(video_id):
    if video_id not in videos:
        abort(404, message='Video does not exist')

def video_exist(video_id):
    if video_id in videos:
        abort(406, message="A video with the ID already exist")

'''define your resource'''
class Video(Resource):
    def get(self, video_id):
        video_not_exist(video_id)
        return videos[video_id] 
    
    def put(self, video_id):
        '''get all the arguments'''
        video_exist(video_id)
        args = Video_put_args.parse_args()
        videos[video_id] = args
        return videos[video_id], 201
     
    def delete(self, video_id):
        video_not_exist(video_id)
        del videos[video_id]
        return '', 204
            

'''register the resource'''
api.add_resource(Video, '/video/<int:video_id>')

if __name__ == "__main__":
    app.run(debug=True)

